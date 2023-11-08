import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';
import 'dotenv/config';

export async function POST(req) {
	const emailUser = process.env.EMAIL_USER;
	const emailPass = process.env.EMAIL_PASS;
	const { nome, telefone, email, assunto, mensagem } = await req.json()

	// comentario

	const transporter = nodemailer.createTransport({
		// service: process.env.EMAIL_SERVICE,
		host: process.env.EMAIL_HOST,
		port: process.env.EMAIL_PORT,
		secure: process.env.EMAIL_SECURE,
		auth: {
			user: emailUser,
			pass: emailPass,
		},
	});

	const mailOptions = {
		from: emailUser,
		to: emailUser,
		subject: `Contato | ${assunto}`,
		html: `
			<h1 style="padding: 10px; color: #EBEAEA; background-color: #9E2537; margin: 0">Contato</h1>
			<div style="background-color: #58141D; color: #EBEAEA; padding: 10px">
				<p>Nome: <strong>${nome}</strong></p>
				<p>Email: <strong>${email}</strong></p>
				<p>Telefone: <strong>${telefone}</strong></p>
				<p style="text-align: justify">Mensagem: <strong>${mensagem}</strong></p>
			</div>
		`
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
}