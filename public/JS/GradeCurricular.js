

        
        const dadosDisciplinas = [
            {
                curso: "",
                codigoTurma: "",
                moduloAno: "",
                turno: "",
                disciplina: "",
                ch: "",
                chPratica: "",
                chTeorica: "",
                totalEncontros: "",
                professor: "",
                laboratorioSala: "",
                recursosLab: ""
            }
        ];

        // Referências aos elementos
        const tabelaCorpo = document.getElementById('tabelaCorpo');
        const btnCarregar = document.getElementById('btnRecarregarDados');


        async function carregarDadosExternos() {
            try {
                const resposta = await fetch('dados.json');
                const dados = await resposta.json();
                
                // Limpa a tabela
                tabelaCorpo.innerHTML = '';
                
                // Processa os dados
                let totalDisciplinas = 0;
                
                dados.disciplinas.forEach(disc => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${disc.curso}</td>
                        <td>${disc.codigoTurma}</td>
                        <td>${disc.moduloAno}</td>
                        <td>${disc.turno}</td>
                        <td>${disc.disciplina}</td>
                        <td class="ch-column">${disc.ch}</td>
                        <td class="ch-column">${disc.chPratica}</td>
                        <td class="ch-column">${disc.chTeorica}</td>
                        <td class="total-encontros">${disc.totalEncontros}</td>
                        <td>${disc.professor}</td>
                        <td>${disc.laboratorioSala}</td>
                        <td>${disc.recursosLab}</td>
                    `;
                    tabelaCorpo.appendChild(row);
                });
                
                contador.textContent = `${totalDisciplinas} disciplinas carregadas`;
                
            } catch (erro) {
                console.error('Erro ao carregar dados:', erro);
                contador.textContent = 'Erro ao carregar dados';
            }
        }
        
        // Mude o event listener para usar a nova função
        btnCarregar.addEventListener('click', carregarDadosExternos);

        // Carrega dados automaticamente ao iniciar (opcional)
        document.addEventListener('DOMContentLoaded', carregarDadosNaTabela);
