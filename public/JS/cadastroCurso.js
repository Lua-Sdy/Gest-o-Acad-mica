
const botao= document.getElementById('botaoCadastrarCurso');
const mensagem= document.getElementById('mensagem');

botao.addEventListener('click',async()=>{

    const data={
        nome:document.getElementById('nome').value,
        cargaHoraria:document.getElementById('cargaHoraria').value,
        area:document.getElementById('area').value,
        descricao: document.getElementById('descricao').value

    }
    try{
    const response= await fetch('/cadastroCurso',{
        method:"POST",
        headers: {'Content-Type':'application/json'},
        body:JSON.stringify(data)
    })

    const resultado= await response.json()

    if(response.ok){
        mensagem.innerText=resultado.mensagem; 
    }else{
      mensagem.innerText=resultado.error;
    }
   }catch(error){
        mensagem.innerText="Erro ao conectar ao servidor"
   }
})