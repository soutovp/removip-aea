import Image from "next/image"

export default function Atendimento() {
	return (
		<>
			<a href="https://whatsa.me/5521970769075/?t=Ol%C3%A1">
				<button><strong>PEÇA AGORA</strong> VIA WHATSAPP</button>
			</a>
			<Image
				src={'/svg/ambulancia.svg'}
				width={50}
				height={50}
				alt="Icone ambulância"
			/>
			<a href="tel:+5521970769075">
				<button><strong>PEÇA AGORA</strong> POR TELEFONE</button>
			</a>
		</>
	)
}