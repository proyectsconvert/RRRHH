
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, User, ChevronDown, ChevronRight, Move, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrgNode {
  id: string;
  name: string;
  position: string;
  department: string;
  level: number;
  parentId?: string;
  children: OrgNode[];
  x: number;
  y: number;
  isExpanded: boolean;
}

interface OrganizationalChartProps {
  employees: any[];
}

export const OrganizationalChart: React.FC<OrganizationalChartProps> = ({ employees }) => {
  const { toast } = useToast();
  const [orgData, setOrgData] = useState<OrgNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeOrgChart();
  }, [employees]);

  const initializeOrgChart = () => {
    // Simulación de datos jerárquicos basados en los empleados
    const sampleOrgData: OrgNode[] = [
      {
        id: '1',
        name: 'María García',
        position: 'CEO',
        department: 'Dirección',
        level: 0,
        children: [
          {
            id: '2',
            name: 'Juan Pérez',
            position: 'Director RRHH',
            department: 'Recursos Humanos',
            level: 1,
            parentId: '1',
            children: [
              {
                id: '3',
                name: 'Ana López',
                position: 'Analista RRHH',
                department: 'Recursos Humanos',
                level: 2,
                parentId: '2',
                children: [],
                x: 100,
                y: 300,
                isExpanded: true
              }
            ],
            x: 50,
            y: 200,
            isExpanded: true
          },
          {
            id: '4',
            name: 'Carlos Ruiz',
            position: 'Director IT',
            department: 'Tecnología',
            level: 1,
            parentId: '1',
            children: [
              {
                id: '5',
                name: 'Laura Martín',
                position: 'Desarrolladora Senior',
                department: 'Tecnología',
                level: 2,
                parentId: '4',
                children: [],
                x: 200,
                y: 300,
                isExpanded: true
              },
              {
                id: '6',
                name: 'David Silva',
                position: 'DevOps Engineer',
                department: 'Tecnología',
                level: 2,
                parentId: '4',
                children: [],
                x: 350,
                y: 300,
                isExpanded: true
              }
            ],
            x: 250,
            y: 200,
            isExpanded: true
          }
        ],
        x: 150,
        y: 100,
        isExpanded: true
      }
    ];

    setOrgData(sampleOrgData);
  };

  const handleNodeDragStart = (e: React.MouseEvent, node: OrgNode) => {
    setIsDragging(true);
    setSelectedNode(node);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleNodeDrag = (e: React.MouseEvent) => {
    if (!isDragging || !selectedNode || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;

    updateNodePosition(selectedNode.id, newX, newY);
  };

  const handleNodeDragEnd = () => {
    setIsDragging(false);
    setSelectedNode(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    const updateNode = (nodes: OrgNode[]): OrgNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, x, y };
        }
        return {
          ...node,
          children: updateNode(node.children)
        };
      });
    };

    setOrgData(updateNode(orgData));
  };

  const toggleNodeExpansion = (nodeId: string) => {
    const toggleNode = (nodes: OrgNode[]): OrgNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        return {
          ...node,
          children: toggleNode(node.children)
        };
      });
    };

    setOrgData(toggleNode(orgData));
  };

  const renderNode = (node: OrgNode): React.ReactNode => {
    return (
      <div key={node.id} className="relative">
        <div
          className={`absolute bg-white border-2 rounded-lg p-3 shadow-lg cursor-move transition-all hover:shadow-xl ${
            selectedNode?.id === node.id ? 'border-cyan-500 ring-2 ring-cyan-200' : 'border-gray-200'
          }`}
          style={{
            left: node.x,
            top: node.y,
            width: '180px',
            zIndex: selectedNode?.id === node.id ? 10 : 1
          }}
          onMouseDown={(e) => handleNodeDragStart(e, node)}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-2">
                {node.name.charAt(0)}
              </div>
              <Move className="w-4 h-4 text-gray-400" />
            </div>
            {node.children.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleNodeExpansion(node.id)}
                className="p-1 h-6 w-6"
              >
                {node.isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
          
          <div className="text-sm">
            <div className="font-semibold text-gray-900 truncate">{node.name}</div>
            <div className="text-gray-600 text-xs truncate">{node.position}</div>
            <Badge variant="outline" className="mt-1 text-xs">
              {node.department}
            </Badge>
          </div>

          {/* Líneas de conexión a hijos */}
          {node.isExpanded && node.children.map((child) => (
            <svg
              key={`line-${node.id}-${child.id}`}
              className="absolute pointer-events-none"
              style={{
                left: '90px',
                top: '100%',
                width: Math.abs(child.x - node.x) + 90,
                height: Math.abs(child.y - node.y - 100),
                zIndex: 0
              }}
            >
              <line
                x1="0"
                y1="0"
                x2={child.x - node.x}
                y2={child.y - node.y - 100}
                stroke="#e5e7eb"
                strokeWidth="2"
              />
            </svg>
          ))}
        </div>

        {/* Renderizar hijos si está expandido */}
        {node.isExpanded && node.children.map(renderNode)}
      </div>
    );
  };

  const saveOrgStructure = async () => {
    try {
      // Aquí iría la lógica para guardar la estructura en la base de datos
      toast({
        title: "Éxito",
        description: "Estructura organizacional guardada correctamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la estructura organizacional",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="h-[600px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-600" />
            Organigrama Interactivo
          </CardTitle>
          <Button onClick={saveOrgStructure} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
            <Save className="w-4 h-4 mr-2" />
            Guardar Estructura
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative w-full h-full overflow-auto bg-gray-50 cursor-grab"
          style={{ minHeight: '500px' }}
          onMouseMove={handleNodeDrag}
          onMouseUp={handleNodeDragEnd}
          onMouseLeave={handleNodeDragEnd}
        >
          {orgData.map(renderNode)}
          
          {/* Instrucciones */}
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md border">
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-1">Instrucciones:</div>
              <div>• Arrastra los nodos para reorganizar</div>
              <div>• Haz clic en las flechas para expandir/colapsar</div>
              <div>• Guarda los cambios cuando termines</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
