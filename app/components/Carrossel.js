'use client'
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import Image from 'next/image'
import '@splidejs/react-splide/css/core';
import carrosselData from './carrossel.json'

export default function Carrossel() {
	return (
		<>
			<Splide hasTrack={false} tag="div"
				options={{
					type: 'loop',
					pagination: false,
					autoplay: true,
					pauseOnHover: true,
					resetProgress: false,
				}}
			>
				<SplideTrack>
					{carrosselData.map(({ imageSrc, altText, title }, index) => (
						<SplideSlide key={index}>
							<Image src={imageSrc} width={600} height={300} alt={altText} />
							<h3>{title}</h3>
						</SplideSlide>
					))}
				</SplideTrack>
				<div className="splide__progress">
					<div className="splide__progress__bar" />
				</div>
				<div className="splide__arrows">
					<button className="splide__arrow splide__arrow--prev">
						<Image
							src={'/svg/botao-esquerda.svg'}
							width={35}
							height={35}
							alt='Botão Esquerda'
						/>
					</button>
					<button className="splide__arrow splide__arrow--next">
						<Image
							src={'/svg/botao-direita.svg'}
							width={35}
							height={35}
							alt='Botão Esquerda'
						/>
					</button>
				</div>
			</Splide>
		</>
	)
}
