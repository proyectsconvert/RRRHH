import React, { useState, useEffect } from 'react';
import { Bell, X, Clock, UserPlus, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'new_candidate' | 'interview_reminder' | 'interview_assigned' | 'upcoming_interview' | 'system';
  title: string;
  message: string;
  candidateId?: string;
  candidateName?: string;
  recruiterName?: string;
  jobTitle?: string;
  interviewTime?: string;
  createdAt: string;
  read: boolean;
}

interface NotificationCenterProps {
  currentUserId?: string;
  currentUserRole?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUserId,
  currentUserRole
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());

  // Load read notification IDs from localStorage on component mount
  useEffect(() => {
    const storedReadIds = localStorage.getItem('readNotificationIds');
    if (storedReadIds) {
      try {
        const parsedIds = JSON.parse(storedReadIds);
        setReadNotificationIds(new Set(parsedIds));
      } catch (error) {
        console.error('Error parsing stored read notification IDs:', error);
      }
    }
  }, []);

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();

    // Set up real-time subscriptions
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'candidates' }, () => {
        loadNotifications();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'applications' }, () => {
        loadNotifications();
      })
      .subscribe();

    // Check for upcoming interviews every minute
    const interval = setInterval(checkUpcomingInterviews, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [currentUserId, currentUserRole, readNotificationIds]);

  const loadNotifications = async () => {
    try {
      const newNotifications: Notification[] = [];

      // 1. New candidate notifications (for admins and recruiters)
      if (currentUserRole === 'admin' || currentUserRole === 'reclutador') {
        const { data: recentCandidates } = await supabase
          .from('candidates')
          .select(`
            id,
            first_name,
            last_name,
            created_at,
            applications(
              id,
              jobs(title)
            )
          `)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .order('created_at', { ascending: false })
          .limit(10);

        recentCandidates?.forEach(candidate => {
          // Get the first job they applied for
          const firstApplication = candidate.applications?.[0];
          const jobTitle = firstApplication?.jobs?.title || 'vacante no especificada';

          newNotifications.push({
            id: `candidate-${candidate.id}`,
            type: 'new_candidate',
            title: 'Nuevo Candidato',
            message: `${candidate.first_name} ${candidate.last_name} ha aplicado al cargo de ${jobTitle}`,
            candidateId: candidate.id,
            candidateName: `${candidate.first_name} ${candidate.last_name}`,
            jobTitle: jobTitle,
            createdAt: candidate.created_at,
            read: false
          });
        });
      }

      // 2. Interview assignment notifications (for admins - when recruiters assign interviews)
      if (currentUserRole === 'admin') {
        const { data: recentInterviewAssignments } = await supabase
          .from('applications')
          .select(`
            id,
            status,
            updated_at,
            recruiter_id,
            candidates!inner(id, first_name, last_name),
            jobs(title),
            recruiter:recruiter_id(first_name, last_name)
          `)
          .in('status', ['entrevista-rc', 'entrevista-et'])
          .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .not('recruiter_id', 'is', null)
          .order('updated_at', { ascending: false });

        recentInterviewAssignments?.forEach(app => {
          if (app.recruiter) {
            const recruiterName = `${app.recruiter.first_name} ${app.recruiter.last_name}`;
            const candidateName = `${app.candidates.first_name} ${app.candidates.last_name}`;
            const interviewType = app.status === 'entrevista-rc' ? 'Recursos Humanos' : 'Técnica';

            newNotifications.push({
              id: `assignment-${app.id}`,
              type: 'interview_assigned',
              title: 'Entrevista Asignada',
              message: `${recruiterName} asignó una entrevista de ${interviewType} al candidato ${candidateName}`,
              candidateId: app.candidates.id,
              candidateName: candidateName,
              recruiterName: recruiterName,
              jobTitle: app.jobs?.title,
              createdAt: app.updated_at,
              read: false
            });
          }
        });
      }

      // 3. Interview reminders (for assigned recruiters and admins)
      if (currentUserId) {
        const { data: upcomingInterviews } = await supabase
          .from('applications')
          .select(`
            id,
            status,
            recruiter_id,
            candidates!inner(id, first_name, last_name),
            jobs(title)
          `)
          .in('status', ['entrevista-rc', 'entrevista-et'])
          .eq('recruiter_id', currentUserId)
          .order('updated_at', { ascending: false });

        upcomingInterviews?.forEach(app => {
          // Create reminder notifications for interviews
          newNotifications.push({
            id: `interview-${app.id}`,
            type: 'interview_reminder',
            title: 'Entrevista Asignada',
            message: `Tienes una entrevista ${app.status === 'entrevista-rc' ? 'de Recursos Humanos' : 'Técnica'} con ${app.candidates.first_name} ${app.candidates.last_name} para la posición ${app.jobs?.title}`,
            candidateId: app.candidates.id,
            candidateName: `${app.candidates.first_name} ${app.candidates.last_name}`,
            createdAt: new Date().toISOString(),
            read: false
          });
        });
      }

      // Filter out already read notifications
      const unreadNotifications = newNotifications.filter(notification => !readNotificationIds.has(notification.id));

      // Sort notifications by created date (newest first)
      unreadNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Keep only the most recent 20 notifications
      const recentNotifications = unreadNotifications.slice(0, 20);

      setNotifications(recentNotifications);
      setUnreadCount(recentNotifications.filter(n => !n.read).length);

    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const checkUpcomingInterviews = async () => {
    if (!currentUserId) return;

    try {
      // Calculate time window: now + 20 minutes
      const now = new Date();
      const twentyMinutesFromNow = new Date(now.getTime() + 20 * 60 * 1000);

      // Get current date and time in YYYY-MM-DD and HH:MM format
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const twentyMinutesTime = twentyMinutesFromNow.toTimeString().slice(0, 5);

      // Query for interviews scheduled within the next 20 minutes
      const { data: upcomingInterviews } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          meeting_date,
          meeting_time,
          recruiter_id,
          candidates!inner(id, first_name, last_name),
          jobs(title)
        `)
        .in('status', ['entrevista-rc', 'entrevista-et'])
        .eq('recruiter_id', currentUserId)
        .not('meeting_date', 'is', null)
        .not('meeting_time', 'is', null);

      // Filter interviews that are within 20 minutes
      const interviewsWithin20Minutes = upcomingInterviews?.filter(app => {
        if (!app.meeting_date || !app.meeting_time) return false;

        // If meeting is today, check if it's within 20 minutes
        if (app.meeting_date === currentDate) {
          return app.meeting_time >= currentTime && app.meeting_time <= twentyMinutesTime;
        }

        // If meeting is in the future, don't show yet
        // (This is a simplified check - in production you'd want more sophisticated date/time comparison)
        return false;
      });

      // Only show reminders for interviews that haven't been read yet
      interviewsWithin20Minutes?.forEach(app => {
        const notificationId = `upcoming-${app.id}`;

        // Skip if already read
        if (readNotificationIds.has(notificationId)) {
          return;
        }

        const existingNotification = notifications.find(n =>
          n.id === notificationId && n.type === 'upcoming_interview'
        );

        if (!existingNotification) {
          const newNotification: Notification = {
            id: notificationId,
            type: 'upcoming_interview',
            title: '¡Entrevista en 20 minutos!',
            message: `Tu entrevista ${app.status === 'entrevista-rc' ? 'de Recursos Humanos' : 'Técnica'} con ${app.candidates.first_name} ${app.candidates.last_name} comienza en 20 minutos`,
            candidateId: app.candidates.id,
            candidateName: `${app.candidates.first_name} ${app.candidates.last_name}`,
            createdAt: new Date().toISOString(),
            read: false
          };

          setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
          setUnreadCount(prev => prev + 1);
        }
      });

    } catch (error) {
      console.error('Error checking upcoming interviews:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    const newReadIds = new Set(readNotificationIds);
    newReadIds.add(notificationId);
    setReadNotificationIds(newReadIds);

    // Persist to localStorage
    localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(newReadIds)));

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    const newReadIds = new Set(readNotificationIds);
    notifications.forEach(notification => {
      newReadIds.add(notification.id);
    });
    setReadNotificationIds(newReadIds);

    // Persist to localStorage
    localStorage.setItem('readNotificationIds', JSON.stringify(Array.from(newReadIds)));

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_candidate':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'interview_reminder':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'interview_assigned':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'upcoming_interview':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'system':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_candidate':
        return 'border-l-blue-500';
      case 'interview_reminder':
        return 'border-l-purple-500';
      case 'interview_assigned':
        return 'border-l-green-500';
      case 'upcoming_interview':
        return 'border-l-orange-500';
      case 'system':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificaciones</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Marcar todas como leídas
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-l-4 ${getNotificationColor(notification.type)} bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: es
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;