import React, { createContext, useState, useCallback, ReactNode, useEffect } from 'react';
import api from '../services/api';

// Interfaces
interface Curso {
    id_curso: number;
    nome_curso: string;
}
interface Professor {
    id: number; // ID da tabela 'professor'
    nome: string; // Nome do usuário associado
    email: string;
}
interface Disciplina {
    id: number;
    nome: string;
    ch_pratica: number;
    ch_teorica: number;
    carga_horaria: number;
    total_de_encontros: number;
    nome_curso: string;
}
interface Turma {
    id_turma: number;
    id_curso_fk: number; // Alterado para id_curso_fk
    nome_curso: string;
    numero_turma: string;
    modulo_ano: string;
    turno: string;
}
interface Sala {
    id: number;
    nome: string;
    tipo_sala: string;
    recursos_sala: string;
}
interface Alocacao {
    id_professor_alocacao: number;
    nome_professor: string;
    nome_disciplina: string;
    numero_turma: string; // Adicionado
    modulo_ano: string; // Adicionado
    turno: string; // Adicionado
    nome_sala?: string;
}

interface DataContextType {
    cursos: Curso[];
    professores: Professor[];
    disciplinas: Disciplina[];
    turmas: Turma[];
    salas: Sala[];
    alocacoes: Alocacao[];
    fetchCursos: () => void;
    fetchProfessores: () => void;
    fetchDisciplinas: () => void;
    fetchTurmas: () => void;
    fetchSalas: () => void;
    fetchAlocacoes: () => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
    children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
    const [cursos, setCursos] = useState<Curso[]>([]);
    const [professores, setProfessores] = useState<Professor[]>([]);
    const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
    const [turmas, setTurmas] = useState<Turma[]>([]);
    const [salas, setSalas] = useState<Sala[]>([]);
    const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);

    const fetchCursos = useCallback(async () => {
        try {
            const response = await api.get('/cursos');
            setCursos(response.data);
        } catch (error) {
            console.error("Erro ao carregar cursos:", error);
        }
    }, []);

    const fetchProfessores = useCallback(async () => {
        try {
            // Chamando /professores para obter a lista básica de professores
            const response = await api.get('/professores');
            setProfessores(response.data);
        } catch (error) {
            console.error("Erro ao carregar professores:", error);
        }
    }, []);

    const fetchDisciplinas = useCallback(async () => {
        try {
            const response = await api.get('/disciplinas');
            setDisciplinas(response.data);
        } catch (error) {
            console.error("Erro ao carregar disciplinas:", error);
        }
    }, []);

    const fetchTurmas = useCallback(async () => {
        try {
            const response = await api.get('/turmas');
            setTurmas(response.data);
        } catch (error) {
            console.error("Erro ao carregar turmas:", error);
        }
    }, []);

    const fetchSalas = useCallback(async () => {
        try {
            const response = await api.get('/salas');
            setSalas(response.data);
        } catch (error) {
            console.error("Erro ao carregar salas:", error);
        }
    }, []);

    const fetchAlocacoes = useCallback(async () => {
        try {
            const response = await api.get('/professor-alocacoes');
            setAlocacoes(response.data);
        } catch (error) {
            console.error("Erro ao carregar alocações:", error);
        }
    }, []);

    useEffect(() => {
        fetchCursos();
        fetchProfessores();
        fetchDisciplinas();
        fetchTurmas();
        fetchSalas();
        fetchAlocacoes();
    }, [fetchCursos, fetchProfessores, fetchDisciplinas, fetchTurmas, fetchSalas, fetchAlocacoes]);

    const value = {
        cursos,
        professores,
        disciplinas,
        turmas,
        salas,
        alocacoes,
        fetchCursos,
        fetchProfessores,
        fetchDisciplinas,
        fetchTurmas,
        fetchSalas,
        fetchAlocacoes,
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}
