
document.querySelectorAll('[data-filter]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    const v=btn.dataset.filter;
    document.querySelectorAll('[data-kind]').forEach(card=>{
      card.dataset.hidden=(v!=='all' && !card.dataset.kind.split(' ').includes(v))?'true':'false';
    });
  });
});
