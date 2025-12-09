import React, { useState, useEffect, useCallback } from 'react';
import { gradeCurricularService } from '../../services/apiService'; // Importar o serviço
import './styles.css';

// Interface alinhada com a nova view vw_grade_curricular_completa
interface Grade {
    id_professor_alocacao: number;
    nome_professor: string;
    nome_curso: string;
    numero_turma: string;
    modulo_ano: string;
    turno: string;
    nome_disciplina: string;
    ch_total: number;
    ch_pratica: number;
    ch_teorica: number;
    total_de_encontros: number;
    laboratorio_sala?: string; // Pode ser nulo
    recursos_lab?: string; // Pode ser nulo
    softwares_usados?: string; // Pode ser nulo
}

export function GradeCurricularPage() {
    const [grade, setGrade] = useState<Grade[]>([]);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const fetchGrade = useCallback(async () => {
        setMessage('');
        setIsError(false);
        try {
            // Usar o serviço e o endpoint correto
            const response = await gradeCurricularService.getGrade(); 
            setGrade(response.data);
            if (response.data.length === 0) {
                setMessage('Nenhum dado encontrado na grade curricular.');
            }
        } catch (error: any) {
            console.error("Erro ao carregar a grade curricular:", error);
            setMessage(error.response?.data?.erro || 'Erro ao carregar a grade curricular.');
            setIsError(true);
            setGrade([]); // Limpa dados antigos em caso de erro
        }
    }, []);

    useEffect(() => {
        fetchGrade();
    }, [fetchGrade]);

    return (
        <div className="grade-container">
            <h2>Grade Curricular</h2>
            
            <div className="space_buttons">
                <button className="btn" id="btnRecarregarDados" onClick={fetchGrade}>
                    Recarregar Dados
                </button>
            </div>

            {message && <p className={`message ${isError ? 'error' : ''}`}>{message}</p>}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Professor</th>
                            <th>Curso</th>
                            <th>Turma</th>
                            <th>Disciplina</th>
                            <th>CH Total</th>
                            <th>CH Prática</th>
                            <th>CH Teórica</th>
                            <th>Encontros</th>
                            <th>Sala</th>
                            <th>Recursos da Sala</th>
                            <th>Softwares</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grade.length > 0 ? grade.map((item) => (
                            <tr key={item.id_professor_alocacao}>
                                <td>{item.nome_professor}</td>
                                <td>{item.nome_curso}</td>
                                <td>{item.numero_turma} ({item.modulo_ano} - {item.turno})</td>
                                <td>{item.nome_disciplina}</td>
                                <td>{item.ch_total}</td>
                                <td>{item.ch_pratica}</td>
                                <td>{item.ch_teorica}</td>
                                <td>{item.total_de_encontros}</td>
                                <td>{item.laboratorio_sala || 'N/A'}</td>
                                <td>{item.recursos_lab || 'N/A'}</td>
                                <td>{item.softwares_usados || 'N/A'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={11} style={{ textAlign: 'center' }}>
                                    {isError ? 'Não foi possível carregar os dados.' : 'Carregando...'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
