"use client"
// import { NextResponse } from "next/server";
import { useForm } from "react-hook-form"
import { toast } from 'react-toastify';

export default function Formulario() {
	const {
		handleSubmit,
		register,
		formState: { errors },
	} = useForm({
		mode: "onBlur",
		// reValidateMode: 'onBlur',
		defaultValues: {
			nome: "",
			telefone: "",
			email: "",
			assunto: "",
			mensagem: "",
		}
	});

	// const onSubmit = (data) => console.log('data');

	const onSubmit = async (data) => {
		const waitNotificationId = toast.info('Aguarde...');

		try {
			const response = await fetch('/api/contato', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			// console.log('Resposta recebida');
			const { message, status } = await response.json();
			toast.update(waitNotificationId, {
				render: message,
				type: status === 200 ? toast.TYPE.SUCCESS : toast.TYPE.ERROR,
			});
		} catch (error) {
			// console.error('Erro ao fazer a solicitação:', error);
			toast.error('Erro ao enviar a mensagem');
		}
	};

	const onError = (errors) => {

	}

	errors?.nome && (toast.error(errors.nome.message, { autoClose: 3000 }))
	errors?.telefone && (toast.error(errors.telefone.message, { autoClose: 3000 }))
	errors?.email && (toast.error(errors.email.message, { autoClose: 3000 }))
	errors?.assunto && (toast.error(errors.assunto.message, { autoClose: 3000 }))

	return (
		<div>
			<div>
				<h2>
					Contato
				</h2>
			</div>
			<form
				onSubmit={handleSubmit(onSubmit, onError)}
			>
				<div>
					<div>
						<label
							htmlFor="nome"
						>
							Nome
						</label>
						<div>
							<input
								{...register("nome", {
									required: "Nome é requerido.",
								})}
								type="text"
								name="nome"
								autoComplete="given-nome"
							/>
						</div>

					</div>
					<div >
						<label
							htmlFor="telefone"
						>
							Telefone
						</label>
						<div >
							<input
								{...register("telefone", {
									required: "Telefone é requerido.",
								})}
								type="tel"
								name="telefone"
								autoComplete="tel"
							/>
						</div>

					</div>
					<div>
						<label
							htmlFor="email"
						>
							Email
						</label>
						<div>
							<input
								{...register("email", {
									required: "Email é requerido.",
									pattern: {
										value: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
										message: "Email inválido"
									}
								})}
								type="email"
								name="email"
								autoComplete="email"
							/>
						</div>

					</div>
					<div>
						<label
							htmlFor="assunto"
						>
							Assunto
						</label>
						<div>
							<input
								{...register("assunto")}
								type="text"
								name="assunto"
								autoComplete="assunto"
							/>
						</div>
					</div>
					<div>
						<label
							htmlFor="mensagem"
						>
							Mensagem
						</label>
						<div>
							<textarea
								{...register("mensagem")}
								name="mensagem"
								rows={4}
							/>
						</div>
					</div>
				</div>
				<div>
					<button
						type="submit"
					>
						Enviar
					</button>
				</div>
			</form>
		</div >
	);
}