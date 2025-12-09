const botaoAdicionar = document.getElementById("botaoAdicionarDisciplina");
const disciplinaContainer = document.getElementById("disciplinaContainer");
const botaoBuscarCurso = document.getElementById("botaoBuscarCurso");
const mensagemCurso = document.getElementById("mensagemCurso");
const idCursoSelecionado = document.getElementById("idCursoSelecionado");
const botaoCadastrar = document.getElementById("cadastrarDisciplina");
const mensagemDisciplina = document.getElementById("mensagemDisciplina");

// Buscar curso
botaoBuscarCurso.addEventListener("click", async () => {
    const nomeCurso = document.getElementById("nome_curso").value;

    try {
        const res = await fetch(`/buscarCurso?nome=${encodeURIComponent(nomeCurso)}`);
        const curso = await res.json();

        if (curso && curso.id_curso) {
            mensagemCurso.textContent = `Curso encontrado: ${curso.nome_curso}`;
            idCursoSelecionado.value = curso.id_curso;
            botaoAdicionar.style.display = "inline-block";
        } else {
            mensagemCurso.textContent = "Curso não encontrado";
            idCursoSelecionado.value = "";
            botaoAdicionar.style.display = "none";
            disciplinaContainer.style.display = "none";
        }
    } catch (err) {
        console.error(err);
        mensagemCurso.textContent = "Erro ao buscar curso";
        botaoAdicionar.style.display = "none";
        disciplinaContainer.style.display = "none";
    }
});

// Mostrar o formulário de cadastro
botaoAdicionar.addEventListener("click", () => {
    disciplinaContainer.style.display = "block";
});

// Cadastrar disciplina
botaoCadastrar.addEventListener("click", async () => {
    const nomeDisciplina = document.getElementById("nomeDisciplina").value;
    const chPratica = parseFloat(document.getElementById("chPratica").value);
    const chTeorica = parseFloat(document.getElementById("chTeorica").value);
    const idCurso = idCursoSelecionado.value;

    if (!idCurso) {
        alert("Busque e selecione um curso antes de cadastrar a disciplina");
        return;
    }

    if (!nomeDisciplina || isNaN(chPratica) || isNaN(chTeorica)) {
        alert("Preencha todos os campos corretamente");
        return;
    }

    try {
        const res = await fetch("/cadastrarDisciplina", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome_disciplina: nomeDisciplina,
                ch_pratica: chPratica,
                ch_teorica: chTeorica,
                id_curso_fk: idCurso
            })
        });

        const data = await res.json();

        if (res.ok) {
            mensagemDisciplina.textContent = "Disciplina cadastrada com sucesso!";
            // Limpar campos
            document.getElementById("nomeDisciplina").value = "";
            document.getElementById("chPratica").value = "";
            document.getElementById("chTeorica").value = "";
        } else {
            mensagemDisciplina.textContent = data.erro || "Erro ao cadastrar disciplina";
        }
    } catch (err) {
        console.error(err);
        mensagemDisciplina.textContent = "Erro ao cadastrar disciplina";
    }
});
