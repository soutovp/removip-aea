import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';
import 'dotenv/config';

// export function GET() {
//   return NextResponse.json({
//     message: "hi",
//   })
// }
export async function POST(req, res) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const { nome, telefone, email, assunto, mensagem } = await req.json()

  const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  // Defina os detalhes do e-mail que você deseja enviar
  const mailOptions = {
    from: emailUser,
    to: 'headbanger.87@hotmail.com',
    subject: `${nome} - ${assunto}`,
    text: `
    Nome: ${nome}
    Telefone: ${telefone}
    Email: ${email}
    Mensagem: 
    ${mensagem}
    `,
  };

  try {
    // Envie o e-mail
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso:', info.response);
    return NextResponse.json({
      status: 200,
      message: 'E-mail enviado com sucesso',
    })
    // res.status(200).json({ message: 'E-mail enviado com sucesso' });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return NextResponse.json({
      status: 500,
      message: 'Erro ao enviar e-mail',
    })
    // res.status(500).json({ error: 'Erro ao enviar e-mail' });
  }
  // console.log(telefone)
}