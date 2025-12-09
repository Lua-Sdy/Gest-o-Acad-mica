import React, { useState, useEffect } from 'react';
import { 
    professorAlocacaoService, 
    professorService, 
    disciplinaService, 
    turmaService, 
    salaService,
    cursoService
} from '../../services/apiService'; // Importar todos os serviços necessários
import './styles.css';

// Interfaces para os dados (refletindo o que o backend deve retornar para os dropdowns)
interface ProfessorOption {
    id_professor: number;
    nome_completo: string;
}

interface CursoOption {
    id_curso: number;
    nome_curso: string;
}

interface DisciplinaOption {
    id_disciplina: number;
    nome_disciplina: string;
    id_curso_fk: number; // Adicionar para filtragem
}

interface TurmaOption {
    id_turma: number;
    numero_turma: string;
    modulo_ano: string;
    turno: string;
    id_curso_fk: number; // Adicionar para filtragem
}

interface SalaOption {
    id_sala: number;
    nome_sala: string;
    tipo_sala: string;
}

// Interface para as alocações exibidas na tabela (assumindo dados já unidos do backend)
interface AlocacaoDisplay {
    id_professor_alocacao: number;
    nome_professor: string;
    nome_curso: string;
    nome_disciplina: string;
    nome_turma: string;
    nome_sala?: string;
}

export function AlocacaoProfessorPage() {
    // Estados locais para os dados dos dropdowns e da tabela
    const [professores, setProfessores] = useState<ProfessorOption[]>([]);
    const [cursos, setCursos] = useState<CursoOption[]>([]);
    const [disciplinas, setDisciplinas] = useState<DisciplinaOption[]>([]);
    const [turmas, setTurmas] = useState<TurmaOption[]>([]);
    const [salas, setSalas] = useState<SalaOption[]>([]);
    const [alocacoes, setAlocacoes] = useState<AlocacaoDisplay[]>([]);

    // State para o formulário
    const [professorId, setProfessorId] = useState('');
    const [cursoId, setCursoId] = useState('');
    const [disciplinaId, setDisciplinaId] = useState('');
    const [turmaId, setTurmaId] = useState('');
    const [salaId, setSalaId] = useState(''); // Sala é opcional

    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // Função para carregar todos os dados necessários
    const fetchData = async () => {
        try {
            const [
                professoresRes, 
                cursosRes, 
                disciplinasRes, 
                turmasRes, 
                salasRes, 
                alocacoesRes
            ] = await Promise.all([
                professorService.getAll(),
                cursoService.getAll(),
                disciplinaService.getAll(),
                turmaService.getAll(),
                salaService.getAll(),
                professorAlocacaoService.getAll()
            ]);

            setProfessores(professoresRes.data.map((p: any) => ({ id_professor: p.id_professor, nome_completo: p.nome_professor })));
            setCursos(cursosRes.data.map((c: any) => ({ id_curso: c.id_curso, nome_curso: c.nome_curso })));
            setDisciplinas(disciplinasRes.data.map((d: any) => ({ id_disciplina: d.id, nome_disciplina: d.nome, id_curso_fk: d.id_curso })));
            setTurmas(turmasRes.data.map((t: any) => ({ id_turma: t.id_turma, numero_turma: t.numero_turma, modulo_ano: t.modulo_ano, turno: t.turno, id_curso_fk: t.id_curso_fk })));
            setSalas(salasRes.data.map((s: any) => ({ id_sala: s.id_sala, nome_sala: s.nome_sala, tipo_sala: s.tipo_sala })));
            setAlocacoes(alocacoesRes.data.map((a: any) => ({
                id_professor_alocacao: a.id_professor_alocacao,
                nome_professor: a.nome_professor,
                nome_curso: a.nome_curso,
                nome_disciplina: a.nome_disciplina,
                nome_turma: `${a.numero_turma} (${a.modulo_ano} - ${a.turno})`,
                nome_sala: a.nome_sala
            })));

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            setMessage('Erro ao carregar dados para os formulários.');
            setIsError(true);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); // Carrega os dados na montagem do componente

    // Handlers
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage('');
        setIsError(false);

        if (!professorId || !disciplinaId || !turmaId) {
            setMessage('Professor, Disciplina e Turma são obrigatórios.');
            setIsError(true);
            return;
        }

        try {
            await professorAlocacaoService.create({ // Usar o serviço
                id_professor_fk: parseInt(professorId),
                id_disciplina_fk: parseInt(disciplinaId),
                id_turma_fk: parseInt(turmaId),
                id_sala_fk: salaId ? parseInt(salaId) : null // Sala é opcional
            });
            setMessage('Professor alocado com sucesso!');
            // Reset form
            setProfessorId('');
            setCursoId(''); // Resetar curso também, pois disciplina depende dele
            setDisciplinaId('');
            setTurmaId('');
            setSalaId('');
            fetchData(); // Recarrega a lista
        } catch (error: any) {
            setMessage(error.response?.data?.erro || 'Erro ao alocar professor.');
            setIsError(true);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await professorAlocacaoService.remove(id); // Usar o serviço
            setMessage('Alocação removida com sucesso!');
            fetchData(); // Recarrega a lista
        } catch (error: any) {
            setMessage(error.response?.data?.erro || 'Erro ao remover alocação.');
            setIsError(true);
        }
    };

    // Filtrar disciplinas e turmas com base no curso selecionado
    const disciplinasFiltradas = cursoId 
        ? disciplinas.filter(d => d.id_curso_fk === parseInt(cursoId)) 
        : disciplinas;

    const turmasFiltradas = cursoId
        ? turmas.filter(t => t.id_curso_fk === parseInt(cursoId))
        : turmas;

    return (
        <div id="alocacaoContainer">
            <div className="form-container">
                <h2>Alocação de Professor</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="professor">Professor</label>
                    <select id="professor" value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
                        <option value="">Selecione um professor</option>
                        {professores.map((prof) => (
                            <option key={prof.id_professor} value={prof.id_professor}>
                                {prof.nome_completo}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="curso">Curso</label>
                    <select id="curso" value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
                        <option value="">Selecione um curso</option>
                        {cursos.map((curso) => (
                            <option key={curso.id_curso} value={curso.id_curso}>
                                {curso.nome_curso}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="disciplina">Disciplina</label>
                    <select id="disciplina" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
                        <option value="">Selecione uma disciplina</option>
                        {disciplinasFiltradas.map((disc) => (
                            <option key={disc.id_disciplina} value={disc.id_disciplina}>
                                {disc.nome_disciplina}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="turma">Turma</label>
                    <select id="turma" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
                        <option value="">Selecione uma turma</option>
                        {turmasFiltradas.map((turma) => (
                            <option key={turma.id_turma} value={turma.id_turma}>
                                {turma.numero_turma} - {turma.modulo_ano} ({turma.turno})
                            </option>
                        ))}
                    </select>

                    <label htmlFor="sala">Sala (Opcional)</label>
                    <select id="sala" value={salaId} onChange={(e) => setSalaId(e.target.value)}>
                        <option value="">Selecione uma sala</option>
                        {salas.map((sala) => (
                            <option key={sala.id_sala} value={sala.id_sala}>
                                {sala.nome_sala} ({sala.tipo_sala})
                            </option>
                        ))}
                    </select>

                    <button type="submit">Alocar Professor</button>

                    {message && (
                        <p style={{ color: isError ? 'red' : 'green', marginTop: '10px' }}>
                            {message}
                        </p>
                    )}
                </form>
            </div>

            <div className="table-container">
                <h2>Professores Alocados</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Professor</th>
                            <th>Curso</th>
                            <th>Disciplina</th>
                            <th>Turma</th>
                            <th>Sala</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alocacoes.map((aloc) => (
                            <tr key={aloc.id_professor_alocacao}>
                                <td>{aloc.nome_professor}</td>
                                <td>{aloc.nome_curso}</td>
                                <td>{aloc.nome_disciplina}</td>
                                <td>{aloc.nome_turma}</td>
                                <td>{aloc.nome_sala || 'N/A'}</td>
                                <td>
                                    <button 
                                        className="delete-btn" 
                                        onClick={() => handleDelete(aloc.id_professor_alocacao)}
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
