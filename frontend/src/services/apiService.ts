import api from './api';

// Funções para Usuários
export const userService = {
    getAll: () => api.get('/usuarios'),
    getById: (id: number) => api.get(`/usuarios/${id}`),
    create: (userData: any) => api.post('/usuarios', userData), // Rota pública para cadastro
    update: (id: number, userData: any) => api.put(`/usuarios/${id}`, userData),
    remove: (id: number) => api.delete(`/usuarios/${id}`),
    login: (credentials: any) => api.post('/login', credentials), // Rota pública para login
};

// Funções para Cursos
export const cursoService = {
    getAll: () => api.get('/cursos'),
    getById: (id: number) => api.get(`/cursos/${id}`),
    create: (cursoData: any) => api.post('/cursos', cursoData),
    update: (id: number, cursoData: any) => api.put(`/cursos/${id}`, cursoData),
    remove: (id: number) => api.delete(`/cursos/${id}`),
};

// Funções para Salas
export const salaService = {
    getAll: () => api.get('/salas'),
    getById: (id: number) => api.get(`/salas/${id}`),
    create: (salaData: any) => api.post('/salas', salaData),
    update: (id: number, salaData: any) => api.put(`/salas/${id}`, salaData),
    remove: (id: number) => api.delete(`/salas/${id}`),
};

// Funções para Softwares
export const softwareService = {
    getAll: () => api.get('/softwares'),
    getById: (id: number) => api.get(`/softwares/${id}`),
    create: (softwareData: any) => api.post('/softwares', softwareData),
    update: (id: number, softwareData: any) => api.put(`/softwares/${id}`, softwareData),
    remove: (id: number) => api.delete(`/softwares/${id}`),
};

// Funções para Disciplinas
export const disciplinaService = {
    getAll: () => api.get('/disciplinas'),
    getById: (id: number) => api.get(`/disciplinas/${id}`),
    create: (disciplinaData: any) => api.post('/disciplinas', disciplinaData),
    update: (id: number, disciplinaData: any) => api.put(`/disciplinas/${id}`, disciplinaData),
    remove: (id: number) => api.delete(`/disciplinas/${id}`),
};

// Funções para Professores
export const professorService = {
    getAll: () => api.get('/professores'),
    getById: (id: number) => api.get(`/professores/${id}`),
    create: (professorData: any) => api.post('/professores', professorData),
    update: (id: number, professorData: any) => api.put(`/professores/${id}`, professorData),
    remove: (id: number) => api.delete(`/professores/${id}`),
    getWithAllocations: () => api.get('/professores-com-nomes'), // Rota específica
};

// Funções para Turmas
export const turmaService = {
    getAll: (id_curso_fk?: number) => api.get('/turmas', { params: { id_curso_fk } }),
    getById: (id: number) => api.get(`/turmas/${id}`),
    create: (turmaData: any) => api.post('/turmas', turmaData),
    update: (id: number, turmaData: any) => api.put(`/turmas/${id}`, turmaData),
    remove: (id: number) => api.delete(`/turmas/${id}`),
};

// Funções para Alocação de Professor
export const professorAlocacaoService = {
    getAll: () => api.get('/professor-alocacoes'),
    getById: (id: number) => api.get(`/professor-alocacoes/${id}`),
    create: (alocacaoData: any) => api.post('/professor-alocacoes', alocacaoData),
    update: (id: number, alocacaoData: any) => api.put(`/professor-alocacoes/${id}`, alocacaoData),
    remove: (id: number) => api.delete(`/professor-alocacoes/${id}`),
};

// Funções para Disciplina-Software
export const disciplinaSoftwareService = {
    link: (linkData: { id_disciplina_fk: number, id_software_fk: number }) => api.post('/disciplina-software', linkData),
    unlink: (id_disciplina_fk: number, id_software_fk: number) => api.delete(`/disciplina-software/${id_disciplina_fk}/${id_software_fk}`),
};

// Funções para Grade Curricular
export const gradeCurricularService = {
    getGrade: () => api.get('/grade-curricular'),
};
