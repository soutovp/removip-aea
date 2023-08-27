import Image from "next/image"

export default function Atendimento() {
	return (
		<>
			<button><strong>PEÇA AGORA</strong> VIA WHATSAPP</button>
			<Image
				src={'/svg/ambulancia.svg'}
				width={50}
				height={50}
				alt="Icone ambulância"
			/>
			<button><strong>PEÇA AGORA</strong> POR TELEFONE</button>
		</>
	)
}