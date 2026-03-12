import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
// import { useRRHHAuth } from "@/contexts/RRHHAuthContext"; // Deprecated for Admin use
import { useAuth } from "@/contexts/AuthContext"; // Use Admin Auth
import {
    Calendar,
    Clock,
    Video,
    MapPin,
    Search,
    Filter,
    MoreVertical,
    Plus,
    RefreshCw,
    User,
    Briefcase
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import TeamsMeetingDialog, { MeetingData } from "@/components/candidates/TeamsMeetingDialog";

interface Meeting {
    id: string; // application_id
    candidate: {
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
    };
    job: {
        title: string;
    };
    meeting_date: string;
    meeting_time: string;
    meeting_link?: string;
    meeting_title?: string;
    meeting_modality?: 'virtual' | 'presencial';
    meeting_address?: string;
    meeting_notes?: string;
    meeting_status?: string;
    recruiter_id: string;
    recruiter?: {
        first_name: string;
        last_name: string;
    }
}

export default function Reuniones() {
    // const { user, role } = useAuth(); // Replace mock auth with real Supabase auth
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const { toast } = useToast();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("mis-reuniones");
    const [modalityFilter, setModalityFilter] = useState<"all" | "virtual" | "presencial">("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog states
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('applications')
                .select(`
          id,
          recruiter_id,
          meeting_date,
          meeting_time,
          meeting_link,
          meeting_title,
          meeting_modality,
          meeting_address,
          meeting_notes,
          meeting_status,
          candidate:candidates(first_name, last_name, email, phone),
          job:jobs(title),
          recruiter:profiles(first_name, last_name)
        `)
                .not('meeting_date', 'is', null)
                .order('meeting_date', { ascending: true })
                .order('meeting_time', { ascending: true });

            const { data, error } = await query;

            if (error) throw error;

            // Transform data to match Meeting interface (handling potentially missing fields smoothly)
            const transformedMeetings: Meeting[] = (data || []).map((app: any) => ({
                id: app.id,
                candidate: app.candidate,
                job: app.job,
                recruiter_id: app.recruiter_id,
                recruiter: app.recruiter,
                meeting_date: app.meeting_date,
                meeting_time: app.meeting_time,
                meeting_link: app.meeting_link,
                meeting_title: app.meeting_title,
                meeting_modality: app.meeting_modality || (app.meeting_link ? 'virtual' : 'presencial'), // Fallback logic
                meeting_address: app.meeting_address,
                meeting_notes: app.meeting_notes,
                meeting_status: app.meeting_status || 'scheduled'
            }));

            setMeetings(transformedMeetings);
        } catch (error) {
            console.error("Error fetching meetings:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar las reuniones.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const getAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);

                // Fetch role from profiles
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setRole(profile.role);
                }
            }
        };
        getAuth();
        fetchMeetings();
    }, []);

    const handleSaveNotes = async () => {
        if (!selectedMeeting) return;

        try {
            const { error } = await supabase
                .from('applications')
                .update({ meeting_notes: notes })
                .eq('id', selectedMeeting.id);

            if (error) throw error;

            toast({
                title: "Notas actualizadas",
                description: "Las novedades de la reunión han sido guardadas.",
            });

            setIsNotesDialogOpen(false);
            fetchMeetings(); // Refresh list works best for simple state sync
        } catch (error) {
            console.error("Error saving notes:", error);
            toast({
                title: "Error",
                description: "No se pudieron guardar las notas.",
                variant: "destructive",
            });
        }
    };

    const handleReschedule = async (meetingData: MeetingData) => {
        if (!selectedMeeting) return;

        try {
            const { error } = await supabase
                .from('applications')
                .update({
                    meeting_date: meetingData.date.toISOString().split('T')[0],
                    meeting_time: meetingData.time,
                    meeting_link: meetingData.meetingLink,
                    meeting_title: meetingData.title,
                    meeting_modality: meetingData.modality,
                    meeting_address: meetingData.address,
                    meeting_status: 'rescheduled',
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedMeeting.id);

            if (error) throw error;

            // Send WhatsApp message about rescheduling
            if (selectedMeeting.candidate.phone) {
                try {
                    const { sendRescheduleMessage } = await import('@/utils/evolution-api');
                    await sendRescheduleMessage(
                        selectedMeeting.candidate.phone,
                        selectedMeeting.candidate.first_name,
                        meetingData.date,
                        meetingData.time,
                        meetingData.modality,
                        meetingData.modality === 'virtual' ? meetingData.meetingLink : (meetingData.address || '')
                    );

                    toast({
                        title: "Notificación enviada",
                        description: "Se ha enviado un mensaje de WhatsApp al candidato con la nueva fecha.",
                    });
                } catch (msgError) {
                    console.error("Error sending reschedule message:", msgError);
                    toast({
                        title: "Advertencia",
                        description: "La reunión se reagendó pero no se pudo enviar el mensaje de WhatsApp.",
                        variant: "destructive",
                    });
                }
            }

            toast({
                title: "Reunión reagendada",
                description: "Los detalles de la reunión han sido actualizados.",
            });

            setIsRescheduleDialogOpen(false);
            fetchMeetings();
        } catch (error) {
            console.error("Error rescheduling:", error);
            toast({
                title: "Error",
                description: "No se pudo reagendar la reunión.",
                variant: "destructive",
            });
        }
    };

    const filteredMeetings = meetings.filter(meeting => {
        // 1. Filter by Tab (Recruiter)
        if (activeTab === "mis-reuniones" && meeting.recruiter_id !== user?.id) {
            return false;
        }
        // "todas" shows everything (only available if role allows, but logic handled below)

        // 2. Filter by Modality
        if (modalityFilter !== "all" && meeting.meeting_modality !== modalityFilter) {
            return false;
        }

        // 3. Search Term
        const searchLower = searchTerm.toLowerCase();
        return (
            meeting.candidate.first_name.toLowerCase().includes(searchLower) ||
            meeting.candidate.last_name.toLowerCase().includes(searchLower) ||
            meeting.meeting_title?.toLowerCase().includes(searchLower)
        );
    });

    const canViewAll = role === 'admin' || role === 'rrhh'; // Logic for who can see "Todas"

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        Gestión de Reuniones
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Reuniones programadas con candidatos
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchMeetings} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            <div className="bg-background p-4 rounded-xl shadow-sm border border-border/60">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <TabsList>
                            <TabsTrigger value="mis-reuniones">Mis Reuniones</TabsTrigger>
                            {canViewAll && <TabsTrigger value="todas">Todas las Reuniones</TabsTrigger>}
                        </TabsList>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar reunión..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <div className="flex bg-muted rounded-lg p-1">
                                <Button
                                    variant={modalityFilter === "all" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setModalityFilter("all")}
                                    className={modalityFilter === "all" ? "bg-background shadow-sm" : ""}
                                >
                                    Todas
                                </Button>
                                <Button
                                    variant={modalityFilter === "virtual" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setModalityFilter("virtual")}
                                    className={modalityFilter === "virtual" ? "bg-background shadow-sm" : ""}
                                >
                                    <Video className="h-3 w-3 mr-1" /> Virtual
                                </Button>
                                <Button
                                    variant={modalityFilter === "presencial" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setModalityFilter("presencial")}
                                    className={modalityFilter === "presencial" ? "bg-background shadow-sm" : ""}
                                >
                                    <MapPin className="h-3 w-3 mr-1" /> Presencial
                                </Button>
                            </div>
                        </div>
                    </div>

                    <TabsContent value="mis-reuniones" className="mt-0">
                        <MeetingList
                            meetings={filteredMeetings}
                            onAddNotes={(m) => { setSelectedMeeting(m); setNotes(m.meeting_notes || ""); setIsNotesDialogOpen(true); }}
                            onReschedule={(m) => { setSelectedMeeting(m); setIsRescheduleDialogOpen(true); }}
                        />
                    </TabsContent>

                    <TabsContent value="todas" className="mt-0">
                        <MeetingList
                            meetings={filteredMeetings}
                            onAddNotes={(m) => { setSelectedMeeting(m); setNotes(m.meeting_notes || ""); setIsNotesDialogOpen(true); }}
                            onReschedule={(m) => { setSelectedMeeting(m); setIsRescheduleDialogOpen(true); }}
                            showRecruiter
                        />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Notes Dialog */}
            <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novedades de la Reunión</DialogTitle>
                        <DialogDescription>
                            Agrega notas o novedades sobre la asistencia del candidato.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="notes" className="mb-2 block">Notas / Observaciones</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="El candidato no asistió..."
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveNotes}>Guardar Novedades</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reschedule Dialog */}
            {selectedMeeting && (
                <TeamsMeetingDialog
                    isOpen={isRescheduleDialogOpen}
                    onClose={() => setIsRescheduleDialogOpen(false)}
                    onMeetingCreated={handleReschedule}
                    candidateName={`${selectedMeeting.candidate.first_name} ${selectedMeeting.candidate.last_name}`}
                    interviewType="entrevista-rc" // Pass generic type, just needing the form
                />
            )}
        </div>
    );
}

function MeetingList({ meetings, onAddNotes, onReschedule, showRecruiter }: {
    meetings: Meeting[],
    onAddNotes: (m: Meeting) => void,
    onReschedule: (m: Meeting) => void,
    showRecruiter?: boolean
}) {
    if (meetings.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-lg font-medium">No hay reuniones programadas</p>
                <p className="text-sm">Intenta cambiar los filtros o programa una nueva reunión desde Candidatos.</p>
            </div>
        );
    }

    // Group meetings by date
    const groupedMeetings: { [key: string]: Meeting[] } = {};
    meetings.forEach(meeting => {
        const dateStr = meeting.meeting_date;
        if (!groupedMeetings[dateStr]) groupedMeetings[dateStr] = [];
        groupedMeetings[dateStr].push(meeting);
    });

    return (
        <div className="space-y-8">
            {Object.keys(groupedMeetings).map(dateStr => {
                const date = new Date(dateStr + 'T00:00:00'); // append time to avoid timezone shift on simple date string
                const isToday = new Date().toDateString() === date.toDateString();

                return (
                    <div key={dateStr}>
                        <h3 className={`font-semibold text-lg mb-4 flex items-center gap-2 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}`}>
                            {format(date, "EEEE d 'de' MMMM", { locale: es })}
                            {isToday && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:hover:bg-blue-900/60">Hoy</Badge>}
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {groupedMeetings[dateStr].map(meeting => (
                                <Card key={meeting.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="p-0 flex flex-col sm:flex-row">
                                        {/* Time Column */}
                                        <div className="sm:w-32 bg-slate-50 dark:bg-muted/30 p-4 flex flex-col justify-center items-center border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-border/50">
                                            <span className="text-xl font-bold text-foreground">
                                                {meeting.meeting_time.substring(0, 5)}
                                            </span>
                                            <Badge variant="outline" className={`mt-2 ${meeting.meeting_modality === 'virtual'
                                                ? 'border-purple-200 text-purple-700 bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:bg-purple-900/20'
                                                : 'border-orange-200 text-orange-700 bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:bg-orange-900/20'
                                                }`}>
                                                {meeting.meeting_modality === 'virtual' ? 'Virtual' : 'Presencial'}
                                            </Badge>
                                        </div>

                                        {/* Content Column */}
                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-lg text-foreground">
                                                        {meeting.candidate.first_name} {meeting.candidate.last_name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                                                        <Briefcase className="h-3 w-3" />
                                                        <span>{meeting.job.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                                                        <span className="font-medium text-foreground">{meeting.meeting_title}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => onAddNotes(meeting)}>
                                                                Agregar Novedades
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => onReschedule(meeting)}>
                                                                Reagendar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-red-600">
                                                                Cancelar Reunión
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
                                                {meeting.meeting_modality === 'virtual' ? (
                                                    <a
                                                        href={meeting.meeting_link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md self-start"
                                                    >
                                                        <Video className="h-4 w-4" />
                                                        Unirse a la reunión
                                                    </a>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-muted/50 px-3 py-1.5 rounded-md self-start">
                                                        <MapPin className="h-4 w-4" />
                                                        {meeting.meeting_address || "Dirección no especificada"}
                                                    </div>
                                                )}

                                                {showRecruiter && meeting.recruiter && (
                                                    <div className="flex items-center gap-2 text-muted-foreground ml-auto">
                                                        <User className="h-3 w-3" />
                                                        <span className="text-xs">Reclutador: {meeting.recruiter.first_name} {meeting.recruiter.last_name}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {meeting.meeting_notes && (
                                                <div className="mt-3 bg-yellow-50 border border-yellow-100 rounded p-2 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-900/50 dark:text-yellow-400">
                                                    <strong>Novedades:</strong> {meeting.meeting_notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
