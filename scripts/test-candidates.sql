-- Test script to insert sample candidates and applications for testing the status tabs
-- Run this in Supabase SQL Editor

-- Insert test candidates
INSERT INTO candidates (id, first_name, last_name, email, phone, phone_country, location, experience_years, skills, resume_url, analysis_summary, created_at, updated_at) VALUES
('test-001', 'Ana', 'García', 'ana.garcia@test.com', '+57 300 123 4567', '57', 'Bogotá, Colombia', 2, ARRAY['React', 'JavaScript', 'CSS'], 'https://example.com/cv1.pdf', '{"compatibilidad": {"porcentaje": 85}, "experiencia": {"años": 2, "relevante": true}, "habilidades": {"matching": 80, "faltantes": ["TypeScript"]}}', NOW(), NOW()),
('test-002', 'Carlos', 'Rodríguez', 'carlos.rodriguez@test.com', '+57 301 234 5678', '57', 'Medellín, Colombia', 4, ARRAY['Python', 'Django', 'PostgreSQL'], 'https://example.com/cv2.pdf', '{"compatibilidad": {"porcentaje": 90}, "experiencia": {"años": 4, "relevante": true}, "habilidades": {"matching": 85, "faltantes": []}}', NOW(), NOW()),
('test-003', 'María', 'López', 'maria.lopez@test.com', '+57 302 345 6789', '57', 'Cali, Colombia', 1, ARRAY['HTML', 'CSS', 'JavaScript'], NULL, '{"compatibilidad": {"porcentaje": 65}, "experiencia": {"años": 1, "relevante": false}, "habilidades": {"matching": 60, "faltantes": ["React", "Node.js"]}}', NOW(), NOW()),
('test-004', 'Juan', 'Martínez', 'juan.martinez@test.com', '+57 303 456 7890', '57', 'Barranquilla, Colombia', 3, ARRAY['Java', 'Spring Boot', 'MySQL'], 'https://example.com/cv4.pdf', '{"compatibilidad": {"porcentaje": 75}, "experiencia": {"años": 3, "relevante": true}, "habilidades": {"matching": 70, "faltantes": ["Docker"]}}', NOW(), NOW()),
('test-005', 'Sofia', 'Hernández', 'sofia.hernandez@test.com', '+57 304 567 8901', '57', 'Pereira, Colombia', 5, ARRAY['Angular', 'TypeScript', 'RxJS'], 'https://example.com/cv5.pdf', '{"compatibilidad": {"porcentaje": 88}, "experiencia": {"años": 5, "relevante": true}, "habilidades": {"matching": 85, "faltantes": []}}', NOW(), NOW());

-- Insert applications with different statuses
INSERT INTO applications (id, candidate_id, job_id, status, created_at, updated_at) VALUES
-- Sin Revisar (new, applied, under_review)
('app-001', 'test-001', '5abc3192-7da8-49cc-b9d3-f99e03244e79', 'new', NOW(), NOW()),
('app-002', 'test-002', 'ecd389bf-3d5f-4954-a3fd-043fa60a5b2e', 'applied', NOW(), NOW()),
('app-003', 'test-003', '287c167c-7612-4d59-bd73-f0df0ba9a538', 'under_review', NOW(), NOW()),

-- En Proceso (entrevista-rc, entrevista-et, asignar-campana)
('app-004', 'test-004', '2afc1dca-f6d5-44b6-a95b-c9a7cc6cfd41', 'entrevista-rc', NOW(), NOW()),
('app-005', 'test-005', '74c03838-9cf1-400b-a987-49763232fc96', 'entrevista-et', NOW(), NOW()),
('app-006', 'test-004', '5abc3192-7da8-49cc-b9d3-f99e03244e79', 'asignar-campana', NOW(), NOW()),

-- En Formación (contratar, training)
('app-007', 'test-005', 'ecd389bf-3d5f-4954-a3fd-043fa60a5b2e', 'contratar', NOW(), NOW()),
('app-008', 'test-002', '287c167c-7612-4d59-bd73-f0df0ba9a538', 'training', NOW(), NOW()),

-- Descartados (rejected, discarded, blocked)
('app-009', 'test-003', '2afc1dca-f6d5-44b6-a95b-c9a7cc6cfd41', 'rejected', NOW(), NOW()),
('app-010', 'test-001', '74c03838-9cf1-400b-a987-49763232fc96', 'discarded', NOW(), NOW()),
('app-011', 'test-003', '5abc3192-7da8-49cc-b9d3-f99e03244e79', 'blocked', NOW(), NOW());