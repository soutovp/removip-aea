import { NextResponse } from "next/server";
// export function GET() {
//   return NextResponse.json({
//     message: "hi",
//   })
// }
export async function POST(req, res) {
  const { nome, telefone, email, assunto, mensagem } = await req.json()
  // console.log(telefone)
  return NextResponse.json({
    message: 'Mensagem recebida',
  })
}
