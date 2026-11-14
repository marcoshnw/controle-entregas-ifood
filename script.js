// #region DADOS, CONFIGURAÇÕES E ARMAZENAMENTO
   'use strict';
const $=id=>document.getElementById(id),moeda=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),nomes=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'],meses=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],periodos=['Almoço','Tarde','Noite','Almoço + Noite','Tarde + Noite','Dia inteiro'],padrao=()=>nomes.map((_,i)=>({ativo:true,qtd:i<5?3:10,periodo:i<5?'Almoço':i===5?'Tarde':'Tarde + Noite'}));
const hoje=new Date(),localDate=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,hojeStr=localDate(hoje),anoAtual=hoje.getFullYear();
function load(k,fallback){try{let v=JSON.parse(localStorage.getItem(k));
return v??fallback}catch{return fallback}}let dados=load('entregas-dados',padrao());
if(!Array.isArray(dados)||dados.length!==7)dados=padrao();
let preco=Math.max(0,Number(localStorage.getItem('entregas-preco'))||7.5),objetivo=Math.max(1,Number(localStorage.getItem('entregas-objetivo'))||900);
let legado=load('entregas-registros-mensais',{});
if(!legado||typeof legado!=='object'||Array.isArray(legado))legado={};
let diarios=load('entregas-diarios-v2',{});
if(!diarios||typeof diarios!=='object'||Array.isArray(diarios))diarios={};
const save=()=>{localStorage.setItem('entregas-dados',JSON.stringify(dados));
localStorage.setItem('entregas-preco',preco);
localStorage.setItem('entregas-objetivo',objetivo);
localStorage.setItem('entregas-registros-mensais',JSON.stringify(legado));
localStorage.setItem('entregas-diarios-v2',JSON.stringify(diarios))};
const parseNum=v=>Math.max(0,Number(v)||0),validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(new Date(s+'T12:00:00').getTime())&&localDate(new Date(s+'T12:00:00'))===s;
const sum=(arr,key)=>arr.reduce((s,x)=>s+Number(x[key]||0),0);
const entries=()=>Object.entries(diarios).filter(([k,v])=>validDate(k)&&v&&typeof v==='object').map(([date,v])=>({date,qtd:parseNum(v.qtd),ganho:parseNum(v.ganho),gorjeta:parseNum(v.gorjeta)}));
const totalEntry=e=>e.ganho+e.gorjeta;
const monthKey=(y,m)=>`${y}-${String(m+1).padStart(2,'0')}`;
const monthEntries=(y,m)=>entries().filter(e=>e.date.startsWith(monthKey(y,m)));
const monthData=(y,m)=>{const list=monthEntries(y,m);
return {qtd:sum(list,'qtd'),gorjeta:sum(list,'gorjeta'),diario:list.reduce((s,e)=>s+totalEntry(e),0),anterior:parseNum(legado[monthKey(y,m)])}};
const monthTotal=(y,m)=>{const d=monthData(y,m);
return d.diario+d.anterior};
function bar(id,v,max){$(id).style.width=Math.min(100,Math.max(0,v/max*100))+'%'}
   // #endregion
   // #region PLANEJAMENTO SEMANAL
   function renderPlan(){ $('days').innerHTML=dados.map((d,i)=>`<div class="day"><label><input type="checkbox" data-i="${i}" data-c="ativo" ${d.ativo?'checked':''}><b>${nomes[i]}</b></label><select data-i="${i}" data-c="periodo" ${d.ativo?'':'disabled'}>${periodos.map(p=>`<option ${p===d.periodo?'selected':''}>${p}</option>`).join('')}</select><input type="number" min="0" step="1" aria-label="Entregas planejadas" data-i="${i}" data-c="qtd" value="${d.qtd}" ${d.ativo?'':'disabled'}><strong>${moeda(d.ativo?d.qtd*preco:0)}</strong></div>`).join('');
const qtd=dados.reduce((s,d)=>s+(d.ativo?parseNum(d.qtd):0),0),sem=qtd*preco,mes=sem*4;
$('qtd').textContent=qtd;
$('sem').textContent=moeda(sem);
$('mes').textContent=moeda(mes);
$('media').textContent=moeda(sem*52/12);
bar('barraPlan',mes,objetivo);
$('metaPlan').textContent=mes>=objetivo?`Projeção acima da meta em ${moeda(mes-objetivo)}.`:`Projeção: faltam ${moeda(objetivo-mes)} para a meta.`;
save()}

   // #endregion
   // #region PAINEL DO MÊS ATUAL
   function renderPrincipal(){const y=hoje.getFullYear(),m=hoje.getMonth(),real=monthTotal(y,m);
$('mesAtualTag').textContent=meses[m]+' / '+y;
$('realMesPrincipal').textContent=moeda(real);
$('metaMesPrincipal').textContent=moeda(objetivo);
$('faltaMesPrincipal').textContent=moeda(Math.max(0,objetivo-real));
$('textoPrincipal').textContent=`${Math.round(real/objetivo*100)}% da meta mensal alcançada`;
bar('barraPrincipal',real,objetivo)}

   // #endregion
   // #region CONTROLE MENSAL
   function renderMensal(){const ano=Number($('ano').value),atual=ano===anoAtual,m=atual?hoje.getMonth():11,real=atual?monthTotal(ano,m):meses.reduce((s,_,i)=>s+monthTotal(ano,i),0),alvo=objetivo*(atual?1:12);
$('tituloAtual').textContent=atual?`${meses[m]} de ${ano} — mês atual`:`Resumo de ${ano}`;
$('realAtual').textContent=moeda(real);
$('faltaAtual').textContent=moeda(Math.max(0,alvo-real));
$('qtdAtual').textContent=atual?monthData(ano,m).qtd:meses.reduce((s,_,i)=>s+monthData(ano,i).qtd,0);
$('textoReal').textContent=`${Math.round(real/alvo*100)}% da ${atual?'meta mensal':'meta anual'} alcançada`;
bar('barraReal',real,alvo);
$('monthgrid').innerHTML=meses.map((nome,i)=>{const d=monthData(ano,i),v=d.diario+d.anterior;return `<div class="monthcard ${atual&&i===hoje.getMonth()?'now':''}"><div class="sectionhead"><strong>${nome}</strong>${atual&&i===hoje.getMonth()?'<span class="tag">ATUAL</span>':''}</div><p><b class="red">${moeda(v)}</b> / ${moeda(objetivo)}</p><div class="mini"><div style="width:${Math.min(100,v/objetivo*100)}%"></div></div><small>${d.qtd} entregas · ${moeda(d.gorjeta)} em gorjetas</small><small>${v>=objetivo?'Meta atingida':`Faltam ${moeda(objetivo-v)}`}</small><div class="field spacer"><label for="legado-${i}">Saldo anterior / ajuste (R$)</label><input id="legado-${i}" type="number" min="0" step="0.01" inputmode="decimal" data-legado="${i}" value="${d.anterior}" /></div></div>`}).join('');
const anual=meses.reduce((s,_,i)=>s+monthTotal(ano,i),0);
$('totalAno').textContent=moeda(anual);
$('faltaAno').textContent=moeda(Math.max(0,objetivo*12-anual))}

   // #endregion
   // #region HISTÓRICO DE ENTREGAS
   function renderHistorico(){const prefix=$('historicoMes').value;
const list=entries().filter(e=>!prefix||e.date.startsWith(prefix)).sort((a,b)=>b.date.localeCompare(a.date));
$('historicoLista').innerHTML=list.length?list.map(e=>`<div class="entry"><div class="detail"><b>${new Date(e.date+'T12:00:00').toLocaleDateString('pt-BR')}</b><div class="tiny">${e.qtd} entregas · ${moeda(e.ganho)} + ${moeda(e.gorjeta)} gorjetas</div></div><span class="money">${moeda(totalEntry(e))}</span><span></span><span></span><div class="actions"><button class="outline" data-edit="${e.date}">Editar</button><button class="alt" data-delete="${e.date}">Excluir</button></div></div>`).join(''):'<div class="empty">Nenhum registro neste período.</div>'}

   // #endregion
   // #region ATUALIZAÇÃO DA TELA E NAVEGAÇÃO
   function refresh(){renderPlan();
renderPrincipal();
renderMensal();
renderHistorico()}function openView(name){document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!=='view-'+name);
if(name==='mensal')renderMensal();
if(name==='historico')renderHistorico();
window.scrollTo(0,0)}

   // #endregion
   // #region EVENTOS E INTERAÇÕES
   $('dataReal').value=hojeStr;
$('historicoMes').value=hojeStr.slice(0,7);
$('valor').value=preco;
$('objetivo').value=objetivo;
for(let a=anoAtual-3;a<=anoAtual+3;a++)$('ano').add(new Option(a,a));
$('ano').value=anoAtual;
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>openView(b.dataset.view));
$('days').addEventListener('change',e=>{const t=e.target;if(!t.dataset.c)return;const i=Number(t.dataset.i),c=t.dataset.c;dados[i][c]=c==='ativo'?t.checked:c==='qtd'?Math.floor(parseNum(t.value)):t.value;renderPlan()});
$('valor').addEventListener('input',()=>{preco=parseNum($('valor').value);renderPlan()});
$('objetivo').addEventListener('input',()=>{objetivo=Math.max(1,parseNum($('objetivo').value));refresh()});



   // #endregion
   // #region REGISTRO DE ENTREGAS E GORJETAS
   $('salvarReal').onclick=()=>{const date=$('dataReal').value,qtd=Number($('qtdReal').value),ganho=Number($('ganhoReal').value),gorjeta=Number($('gorjetaReal').value||0);
if(!validDate(date)||!Number.isInteger(qtd)||qtd<1||!$('ganhoReal').value.trim()||![ganho,gorjeta].every(v=>Number.isFinite(v)&&v>=0)){$('msgReal').textContent='Preencha uma data válida, a quantidade e os valores recebidos.';
return}if(diarios[date]&&!confirm('Já existe um registro nesta data. Deseja substituir os valores?'))return;
diarios[date]={qtd,ganho,gorjeta};
save();
$('msgReal').textContent=`Registro salvo: ${qtd} entregas, total ${moeda(ganho+gorjeta)}.`;
$('ganhoReal').value='';
$('gorjetaReal').value='0';
refresh()};
$('limparReal').onclick=()=>{$('dataReal').value=hojeStr;
$('qtdReal').value=3;
$('ganhoReal').value='';
$('gorjetaReal').value=0;
$('msgReal').textContent=''};
$('ano').onchange=renderMensal;
$('historicoMes').onchange=renderHistorico;
$('monthgrid').addEventListener('change',e=>{if(!e.target.matches('[data-legado]'))return;legado[monthKey(Number($('ano').value),Number(e.target.dataset.legado))]=parseNum(e.target.value);save();renderMensal();renderPrincipal()});
function edit(date){const e=diarios[date];
if(!e)return;
$('dataReal').value=date;
$('qtdReal').value=e.qtd;
$('ganhoReal').value=e.ganho;
$('gorjetaReal').value=e.gorjeta;
openView('principal');
$('dataReal').focus();
$('msgReal').textContent='Editando '+date+': clique em Registrar dia para substituir.'}document.addEventListener('click',e=>{const btn=e.target.closest('[data-edit],[data-delete]');if(!btn)return;if(btn.dataset.edit)edit(btn.dataset.edit);if(btn.dataset.delete&&confirm('Excluir o registro de '+btn.dataset.delete+'?')){delete diarios[btn.dataset.delete];save();refresh()}});


   // #endregion
   // #region BACKUP E IMPORTAÇÃO
   $('exportar').onclick=()=>{const blob=new Blob([JSON.stringify({version:2,diarios,legado,dados,preco,objetivo},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
a.href=url;
a.download='backup-entregas-'+hojeStr+'.json';
a.click();
setTimeout(()=>URL.revokeObjectURL(url),2000)};
$('importar').onclick=()=>$('arquivoImport').click();
$('arquivoImport').onchange=async e=>{const file=e.target.files[0];
if(!file)return;
try{const obj=JSON.parse(await file.text());
if(obj.version!==2||!obj.diarios||typeof obj.diarios!=='object'||Array.isArray(obj.diarios))throw Error('Arquivo inválido');
if(!confirm('Importar este backup? Os registros atuais serão substituídos.'))return;
diarios=obj.diarios;
legado=obj.legado||{};
if(Array.isArray(obj.dados)&&obj.dados.length===7)dados=obj.dados;
preco=parseNum(obj.preco);
objetivo=Math.max(1,parseNum(obj.objetivo));
$('valor').value=preco;
$('objetivo').value=objetivo;
save();
refresh();
alert('Backup importado!')}catch(err){alert('Não foi possível importar: '+err.message)}finally{e.target.value=''}};
refresh();
   // #endregion
