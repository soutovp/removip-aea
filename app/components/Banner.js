import bannerStyle from '../styles/components/banner.module.sass'
export default function Banner({ className = null, alt, img }) {
	return (
		<>
			<section className={`${bannerStyle.sessaoBanner} ${className}`}>
				<header>
					<div tabIndex={-1}></div>
					<div>
						<img
							src={`/images/${img}.png`}
							alt={alt}
						/>
					</div>
				</header>
				<div>
					<img
						src={'/svg/frase-efeito-removip.svg'}
						alt={'Sua tranquilidade em boas mãos.'}
						width={781}
						height={297}
					/>
				</div>
			</section>
		</>
	)
}