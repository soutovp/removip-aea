'use client'
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import Image from 'next/image'
import '@splidejs/react-splide/css/core';

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
					<SplideSlide>
						<Image src={'/images/servico_resgate-aeromedico.jpg'} width={600} height={300} alt="Resgate aeromédico" />
						<h3>Resgate Aeromédico</h3>
					</SplideSlide>
					<SplideSlide>
						<Image src={'/images/servico_remocao-ambulancia-particular.jpg'} width={600} height={300} alt="Remoção de pacientes" />
						<h3>Remoção de pacientes</h3>
					</SplideSlide>
					<SplideSlide>
						<Image src={'/images/servico_ambulancia-cobertura-medica.jpg'} width={600} height={300} alt="Cobertura médica de eventos" />
						<h3>Cobertura médica de eventos</h3>
					</SplideSlide>
					<SplideSlide>
						<Image src={'/images/servico_posto-medico-evento.jpg'} width={600} height={300} alt="Postos médicos" />
						<h3>Postos médicos</h3>
					</SplideSlide>
					<SplideSlide>
						<Image src={'/images/servico_locacao-aluguel-ambulancia.jpg'} width={600} height={300} alt="Locação de ambulâncias" />
						<h3>Locação de ambulâncias</h3>
					</SplideSlide>
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
