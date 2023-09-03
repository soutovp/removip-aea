import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';
import 'dotenv/config';

export async function POST(req) {
	const emailUser = process.env.EMAIL_USER;
	const emailPass = process.env.EMAIL_PASS;
	const { nome, telefone, email, assunto, mensagem } = await req.json()

	const transporter = nodemailer.createTransport({
		service: process.env.EMAIL_SERVICE,
		auth: {
			user: emailUser,
			pass: emailPass,
		},
	});

	const mailOptions = {
		from: emailUser,
		to: emailUser,
		subject: `Contato | ${assunto}`,
		html: `<h1 style="background-color: red; color: white;">Hello World</h1>
			<p>${nome}</p>
			<p>${email}</p>
			<p>Mensagem</p>
			<p>${mensagem}</p>
		`
		//     text: `
		//     Nome: ${nome}
		//     Telefone: ${telefone}
		//     Email: ${email}
		//     Mensagem:
		//     ${mensagem}
		//     `,
	};

	try {
		const info = await transporter.sendMail(mailOptions);
		console.log('E-mail enviado com sucesso:', info.response);
		return NextResponse.json({
			status: 200,
			message: 'E-mail enviado com sucesso',
		})
	} catch (error) {
		console.error('Erro ao enviar e-mail:', error);
		return NextResponse.json({
			status: 500,
			message: 'Erro ao enviar e-mail',
		})
	}
	// console.log(telefone)
}