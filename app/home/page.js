import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
import Carrossel from '../components/Carrossel'
import '../styles/_home.sass'
import Image from 'next/image'
import Head from 'next/head'
export function Souto({ children }) {
	return (
		<div>{children}</div>
	)
}
export default function Home() {
	return (
		<>
			<Head>
				<title>Removip - Home</title>
			</Head>
			<main className='home'>
				<Banner alt={'Background de ambulancias'} img={'bg-ambulancias'} />
				<div className='background-image'>
					<div className='background-image-2'></div>
					<p className='servicoAmbulancia'>
						Serviço de ambulância particular para atendimentos, remoções, altas e exames emergenciais.
					</p>
					<Aberto />
				</div>
				<section className='home-section-first'>
					<ul>
						<li>
							<div>
								<Image
									src={'/svg/coracao.svg'}
									width={50}
									height={50}
									alt={'Icone de coração'}
								/>
								<h2>Especialidades</h2>
								<p>Remoção, Transporte e Atendimento médico</p>
							</div>
						</li>
						<li>
							<div>
								<Image
									src={'/svg/ambulancia-escura.svg'}
									width={50}
									height={50}
									alt={'Icone de coração'}
								/>
								<h2>A Frota</h2>
								<p>Nossa frota grante eficiência para qualquer tipo de emergência</p>
							</div>
						</li>
						<li>
							<div>
								<Image
									src={'/svg/cruz-contorno.svg'}
									width={50}
									height={50}
									alt={'Icone de coração'}
								/>
								<h2>Credeinciamento</h2>
								<p>Oferecemos toda a segurança de um profissionalismo credenciado</p>
							</div>
						</li>
						<li>
							<div>
								<Image
									src={'/svg/atendente-ambulancia.svg'}
									width={50}
									height={50}
									alt={'Icone de coração'}
								/>
								<h2>A Equipe</h2>
								<p>Infraestrutura sob comando de profissionais qualificados</p>
							</div>
						</li>
					</ul>
				</section>
				<section className='carrossel'>
					<h2>Serviços que oferecemos</h2>
					<Carrossel />
				</section>
			</main>
		</>
	)
}