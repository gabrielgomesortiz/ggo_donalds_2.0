document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signupForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const toggleBtns = document.querySelectorAll('.toggle-password');

    // Mostrar/ocultar senha
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input.type === 'password') {
                input.type = 'text';
                btn.querySelector('svg').style.stroke = '#007bff';
            } else {
                input.type = 'password';
                btn.querySelector('svg').style.stroke = '#555';
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        successMessage.textContent = '';

        const nome = form.nome.value.trim();
        const email = form.email.value.trim();
        const senha = form.senha.value;
        const confirmarSenha = form.confirmar_senha.value;

        // Validação simples
        if (!nome || !email || !senha || !confirmarSenha) {
            errorMessage.textContent = 'Preencha todos os campos.';
            return;
        }
        if (senha.length < 6) {
            errorMessage.textContent = 'A senha deve ter pelo menos 6 caracteres.';
            return;
        }
        if (senha !== confirmarSenha) {
            errorMessage.textContent = 'As senhas não coincidem.';
            return;
        }

        try {
            const res = await fetch('http://localhost:3001/pessoa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha })
            });

            if (res.ok) {
                successMessage.textContent = 'Conta criada com sucesso!';
                form.reset();
                // Redirecionamento removido
            } else {
                const data = await res.json();
                errorMessage.textContent = data.error || data.message || 'Erro ao criar conta.';
            }
        } catch (err) {
            errorMessage.textContent = 'Erro de conexão com o servidor.';
        }
    });
});