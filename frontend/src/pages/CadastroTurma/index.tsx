import React, { useState, useEffect, useCallback } from 'react';
import { turmaService, cursoService } from '../../services/apiService';
import './styles.css';

interface CursoOption {
    id_curso: number;
    nome_curso: string;
}

interface Turma {
    id_turma: number;
    id_curso_fk: number;
    numero_turma: string;
    modulo_ano: string;
    turno: string;
    nome_curso: string; // Para exibição na tabela
}

export function CadastroTurmaPage() {
    // Estados locais para os dados dos dropdowns e da tabela
    const [cursos, setCursos] = useState<CursoOption[]>([]);
    const [turmas, setTurmas] = useState<Turma[]>([]);

    // State para o formulário
    const [cursoId, setCursoId] = useState('');
    const [numeroTurma, setNumeroTurma] = useState('');
    const [moduloAno, setModuloAno] = useState('');
    const [turno, setTurno] = useState('matutino');

    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [editingTurmaId, setEditingTurmaId] = useState<number | null>(null);

    const fetchCursos = useCallback(async () => {
        try {
            const response = await cursoService.getAll();
            setCursos(response.data);
        } catch (error: any) {
            console.error("Erro ao buscar cursos:", error);
            setMessage(error.response?.data?.erro || 'Erro ao carregar cursos.');
            setIsError(true);
        }
    }, []);

    const fetchTurmas = useCallback(async () => {
        try {
            const response = await turmaService.getAll();
            setTurmas(response.data);
        } catch (error: any) {
            console.error("Erro ao buscar turmas:", error);
            setMessage(error.response?.data?.erro || 'Erro ao carregar turmas.');
            setIsError(true);
        }
    }, []);

    useEffect(() => {
        fetchCursos();
        fetchTurmas();
    }, [fetchCursos, fetchTurmas]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage('');
        setIsError(false);

        if (!cursoId || !numeroTurma || !moduloAno || !turno) {
            setMessage('Todos os campos são obrigatórios.');
            setIsError(true);
            return;
        }

        const turmaData = {
            id_curso_fk: parseInt(cursoId),
            numero_turma: numeroTurma,
            modulo_ano: moduloAno,
            turno: turno
        };

        try {
            if (editingTurmaId) {
                await turmaService.update(editingTurmaId, turmaData);
                setMessage('Turma atualizada com sucesso!');
            } else {
                await turmaService.create(turmaData);
                setMessage('Turma cadastrada com sucesso!');
            }
            
            // Reset form
            setCursoId('');
            setNumeroTurma('');
            setModuloAno('');
            setTurno('matutino');
            setEditingTurmaId(null);
            fetchTurmas(); // Recarrega a lista
        } catch (error: any) {
            setMessage(error.response?.data?.erro || 'Erro ao salvar turma.');
            setIsError(true);
        }
    };

    const handleEdit = (turma: Turma) => {
        setCursoId(turma.id_curso_fk.toString());
        setNumeroTurma(turma.numero_turma);
        setModuloAno(turma.modulo_ano);
        setTurno(turma.turno);
        setEditingTurmaId(turma.id_turma);
        setMessage('');
        setIsError(false);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja deletar esta turma?')) {
            try {
                await turmaService.remove(id);
                setMessage('Turma removida com sucesso!');
                fetchTurmas(); // Recarrega a lista
            } catch (error: any) {
                setMessage(error.response?.data?.erro || 'Erro ao remover turma.');
                setIsError(true);
            }
        }
    };

    return (
        <div id="turmaContainer">
            <div className="form-container">
                <h2>{editingTurmaId ? 'Editar Turma' : 'Cadastro de Turma'}</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="curso">Curso</label>
                    <select id="curso" value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
                        <option value="">Selecione um curso</option>
                        {cursos.map((curso) => (
                            <option key={curso.id_curso} value={curso.id_curso}>
                                {curso.nome_curso}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="numeroTurma">Número da Turma</label>
                    <input
                        type="text"
                        id="numeroTurma"
                        value={numeroTurma}
                        onChange={(e) => setNumeroTurma(e.target.value)}
                        placeholder="Ex: 101 ou A"
                    />

                    <label htmlFor="moduloAno">Módulo/Ano</label>
                    <input
                        type="text"
                        id="moduloAno"
                        value={moduloAno}
                        onChange={(e) => setModuloAno(e.target.value)}
                        placeholder="Ex: 2024.1"
                    />

                    <label htmlFor="turno">Turno</label>
                    <select id="turno" value={turno} onChange={(e) => setTurno(e.target.value)}>
                        <option value="matutino">Matutino</option>
                        <option value="diurno">Diurno</option>
                        <option value="noturno">Noturno</option>
                        <option value="integral">Integral</option>
                    </select>

                    <button type="submit">{editingTurmaId ? 'Atualizar Turma' : 'Cadastrar Turma'}</button>
                    {editingTurmaId && (
                        <button type="button" onClick={() => {
                            setCursoId(''); setNumeroTurma(''); setModuloAno(''); setTurno('matutino'); setEditingTurmaId(null); setMessage(''); setIsError(false);
                        }}>Cancelar Edição</button>
                    )}

                    {message && (
                        <p style={{ color: isError ? 'red' : 'green', marginTop: '10px' }}>
                            {message}
                        </p>
                    )}
                </form>
            </div>

            <div className="table-container">
                <h2>Turmas Cadastradas</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Curso</th>
                            <th>Nº da Turma</th>
                            <th>Módulo/Ano</th>
                            <th>Turno</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {turmas.map((turma) => (
                            <tr key={turma.id_turma}>
                                <td>{turma.id_turma}</td>
                                <td>{turma.nome_curso}</td>
                                <td>{turma.numero_turma}</td>
                                <td>{turma.modulo_ano}</td>
                                <td>{turma.turno}</td>
                                <td>
                                    <button className="edit-btn" onClick={() => handleEdit(turma)}>Editar</button>
                                    <button 
                                        className="delete-btn" 
                                        onClick={() => handleDelete(turma.id_turma)}
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
