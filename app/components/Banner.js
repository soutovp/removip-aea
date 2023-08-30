import Image from "next/image"
import Atendimento from "./Atendimento"
export default function Banner(props) {
	let { img, alt } = props
	return (
		<>
			<section className="sessao-banner">
				<header>
					<div className="sobreposta" tabIndex={-1}></div>
					<Image
						src={`/images/${img}.png`}
						alt={alt}
						fill
					/>
				</header>
				<div className="sessao-banner-div">
					<Image
						src={'/svg/frase-efeito-removip.svg'}
						alt={'Sua tranquilidade em boas mãos.'}
						width={781}
						height={297}
						className="tranquilidade"
					/>
					<div className="atendimento">
						<Atendimento />
					</div>
				</div>
			</section>
		</>
	)
}