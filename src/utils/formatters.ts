
// Translation helpers for application status and job types

export function getStatusText(status: string) {
  const statusMap: {[key: string]: string} = {
    'new': 'Nuevo Candidato',
    'applied': 'Aplicado',
    'under_review': 'Bajo Revisión',
    'entrevista-rc': 'Entrevista Inicial',
    'entrevista-et': 'Entrevista Técnica',
    'prueba-tecnica': 'Prueba Técnica',
    'asignar-campana': 'En Campaña',
    'contratar': 'Proceso de Contratación',
    'contratado': 'Contratado',
    'training': 'En Formación',
    'rejected': 'Rechazado',
    'discarded': 'Descartado',
    'blocked': 'Bloqueado',
    // Legacy mappings for backward compatibility
    'reviewing': 'En revisión',
    'interview': 'Entrevista',
    'selected': 'Seleccionado',
    'hired': 'Proceso de Contratación',
    'pending': 'Pendiente'
  };
  return statusMap[status] || status;
}

export function getJobTypeText(type: string) {
  const typeMap: {[key: string]: string} = {
    'full-time': 'Tiempo Completo',
    'part-time': 'Medio Tiempo',
    'contract': 'Contrato',
    'internship': 'Pasantía',
    'temporary': 'Temporal'
  };
  return typeMap[type] || type;
}
