import Image from "next/image"
import Atendimento from "./Atendimento"
export default function Banner(props) {
	let { img, alt } = props
	return (
		<>
			<section className="sessao-banner">
				<header>
					<div className="sobreposta"></div>
					<Image
						src={`/images/${img}.jpg`}
						alt={alt}
						fill
					/>
				</header>
				<main>
					<Image
						src={'/svg/frase-efeito-removip.svg'}
						alt={'Sua tranquilidade em boas mãos.'}
						width={700}
						height={700}
					/>
				</main>
				<footer>
					<Atendimento />
				</footer>
			</section>
		</>
	)
}