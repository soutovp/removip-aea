'use client'
import Image from "next/image"
// import atendimento from '../styles/components/atendimento.module.sass'
/**
 *
 * São botões dentro da página que levam o usuário para o whatsapp e para ligação por telefone.
 */
export default function Atendimento({ className = null }) {
	return (
		<div className={`${className}`}>
			<a href="https://whatsa.me/5521970769075/?t=Ol%C3%A1" target="_blank">
				<button tabIndex={-1}><strong>PEÇA AGORA</strong> VIA WHATSAPP</button>
			</a>
			<Image
				src={'/svg/ambulancia.svg'}
				width={50}
				height={50}
				alt="Icone ambulância"
			/>
			<a href="tel:+5521970769075">
				<button tabIndex={-1}><strong>PEÇA AGORA</strong> POR TELEFONE</button>
			</a>
		</div>
	)
}