(function(){
    const qs=new URLSearchParams(location.search);
    const monto=Number(qs.get('monto')||0).toFixed(2);
    const r=JSON.parse(localStorage.getItem('cc_reserva_demo')||'{}');
    // Validación: si no hay reserva válida, redirige
    if(!r || !r.expNombre || !r.fecha || !r.participantes){
      window.location.href = '/user';
      return;
    }
    document.getElementById('monto').textContent=`USD ${monto}`;
    document.getElementById('expNombre').textContent=r.expNombre||'';
    document.getElementById('expFecha').textContent =`Fecha: ${r.fecha||''}`;
    document.getElementById('expParticipantes').textContent=`Participantes: ${r.participantes||''}`;
  
    if(Array.isArray(r.equipos)&&r.equipos.length){
      document.getElementById('equipTitle').classList.remove('d-none');
      document.getElementById('equipList').innerHTML=r.equipos.map(e=>`<li>• ${e}</li>`).join('');
    }
  
    document.getElementById('btnBack').onclick=()=>history.back();
  
    const form=document.getElementById('formPay');
    const msg =document.getElementById('msg');
  
    // Si el usuario sale o recarga la página sin pagar, elimina la reserva pendiente
    window.addEventListener('beforeunload', async (e) => {
      const reservaId = qs.get('id');
      // Si la reserva aún no está pagada, eliminarla
      if (reservaId && !form.classList.contains('pago-ok')) {
        await fetch(`/api/reservas/${reservaId}`, { method: 'DELETE' });
        localStorage.removeItem('cc_reserva_demo');
      }
    });

    form.addEventListener('submit', async e=>{
      e.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }

      const ok = Math.random() > 0.3;
      msg.className = `alert mt-3 ${ok ? 'alert-success' : 'alert-danger'}`;
      msg.textContent = ok ? 'Pago exitoso 🎉' : 'Pago rechazado. Inténtalo de nuevo.';
      msg.classList.remove('d-none');

      setTimeout(async () => {
        const reservaId = qs.get('id');
        if (ok) {
          await fetch(`/api/reservas/${reservaId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'pagado' })
          });
          form.classList.add('pago-ok');
          localStorage.removeItem('cc_reserva_demo');
          window.location.href = '/mis_reservas';
        } else {
          // Si el pago falla, elimina la reserva
          await fetch(`/api/reservas/${reservaId}`, { method: 'DELETE' });
          localStorage.removeItem('cc_reserva_demo');
          location.href = location.href;
        }
      }, 1800);
    });
  })();
