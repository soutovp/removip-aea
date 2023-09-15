'use client'
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import React, { useEffect, useState } from 'react';

export default function Formulario({ className = null }) {
	const {
		handleSubmit,
		register,
		formState: { errors },
	} = useForm({
		mode: 'onBlur',
		defaultValues: {
			nome: '',
			telefone: '',
			email: '',
			assunto: '',
			mensagem: '',
		},
	});

	const [botaoDesativado, setDesativarBotao] = useState(false);

	const onSubmit = async (data) => {
		const waitNotificationId = toast.info('Aguarde...');
		setDesativarBotao(true);

		try {
			const response = await fetch('/api/contato', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			const { message, status } = await response.json();
			toast.update(waitNotificationId, {
				render: message,
				type: status === 200 ? toast.TYPE.SUCCESS : toast.TYPE.ERROR,
			});

			setDesativarBotao(false);
		} catch (error) {
			toast.error('Erro ao enviar a mensagem');
		}
	};

	const onError = (errors) => {
		if (errors) {
			Object.keys(errors).forEach((key) => {
				toast.error(errors[key]?.message, { autoClose: 3000 });
			});
		}
	};

	const handleBlur = (campo) => {
		if (errors[campo]) {
			toast.error(errors[campo]?.message, { autoClose: 3000 });
		}
	};

	useEffect(() => {
		const campos = ['nome', 'telefone', 'email'];

		campos.forEach((campo) => {
			document.querySelector(`[name="${campo}"]`).addEventListener('blur', () => {
				handleBlur(campo);
			});
		});
	}, [errors]);

	return (
		<section className={className}>
			<h2>Contato</h2>
			<form onSubmit={handleSubmit(onSubmit, onError)}>
				<div>
					<div>
						<label htmlFor="nome">Nome</label>
						<div>
							<input
								{...register('nome', {
									required: 'Nome é requerido.',
								})}
								type="text"
								name="nome"
								autoComplete="nome"
								placeholder="Nome"
							/>
						</div>
					</div>
					<div>
						<label htmlFor="telefone">Telefone</label>
						<div>
							<input
								{...register('telefone', {
									required: 'Telefone é requerido.',
								})}
								type="tel"
								name="telefone"
								autoComplete="(99)9?9999-9999"
								placeholder="Telefone"
							/>
						</div>
					</div>
					<div>
						<label htmlFor="email">Email</label>
						<div>
							<input
								{...register('email', {
									required: 'Email é requerido.',
									pattern: {
										value: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
										message: 'Email inválido',
									},
								})}
								type="email"
								name="email"
								autoComplete="email"
								placeholder="E-mail"
							/>
						</div>
					</div>
					<div>
						<label htmlFor="assunto">Assunto</label>
						<div>
							<input
								{...register('assunto')}
								type="text"
								name="assunto"
								autoComplete="assunto"
								placeholder="Assunto"
							/>
						</div>
					</div>
					<div>
						<label htmlFor="mensagem">Mensagem</label>
						<div>
							<textarea
								{...register('mensagem')}
								name="mensagem"
								rows={4}
								placeholder="Mensagem"
							/>
						</div>
					</div>
					<div>
						<div>
							<div>
								<div>
									<img
										src="/svg/instagram.svg"
										alt="Ícone de Instagram da @REMOVIP_"
									/>
									<p>@REMOVIP_</p>
								</div>
								<p>(21) 3148-4158<br />removip@removip.com.br</p>
							</div>
						</div>
						<div>
							<button type="submit" disabled={botaoDesativado}>
								Enviar!
							</button>
							<p>
								Rua joao Tarquato, 248 Bonsucesso<br />Rio de Janeiro - RJ | CEP
								21032-150
							</p>
						</div>
					</div>
				</div>
			</form>
		</section>
	);
}