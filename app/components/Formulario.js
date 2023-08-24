"use client";
import { useForm } from "react-hook-form";

export default function Formulario() {

	const {
		handleSubmit,
		register,
		formState: { errors },
	} = useForm({
		mode: "onBlur",
		reValidateMode: 'onBlur',
		// defaultValues: {
		// 	nome: "",
		// 	telefone: "",
		// 	email: "",
		// 	assunto: "",
		// 	mensagem: "",
		// }
	});

	// const onSubmit = (data) => console.log('data');
	const onSubmit = (data) => {
		console.log(data)
		fetch('/api/contato', {
			method: 'POST',
			headers: {
				'Accept': 'application/json, text/plain, */*',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data) // Serializa o objeto data para JSON
		})
			.then((res) => {
				console.log('Resposta recebida');
				if (res.status === 200) {
					console.log('Sucesso!');
				}
			})

		// console.log(JSON.stringify(data))
	};

	const onError = (errors) => console.log(errors);

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
						{errors?.nome && (
							<span>{errors.nome.message}</span>
						)}
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
						{errors?.telefone && (
							<span>{errors.telefone.message}</span>
						)}
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
										value: "[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$",
										message: "Email inválido"
									}
								})}
								type="email"
								name="email"
								autoComplete="email"
							/>
						</div>
						{errors?.email && (
							<span>{errors.email.message}</span>
						)}
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