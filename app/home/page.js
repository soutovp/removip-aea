import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
import Carrossel from '../components/Carrossel'
import Image from 'next/image'
import Atendimento from '../components/Atendimento'
import homeStyle from '../styles/pages/home/page.module.sass'

export default function Home() {
	return (
		<>
			<Banner alt={'Background de ambulancias'} img={'bg-ambulancias'} />
			<Atendimento className={homeStyle.atendimento} />
			<div className={homeStyle.servicoAtendimento}>
				<div></div>
				<p>
					Serviço de ambulância particular para atendimentos, remoções, altas e exames emergenciais.
				</p>
				<Aberto />
			</div>
			<section className={homeStyle.homeSectionFirst}>
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
			<section className={homeStyle.carrossel}>
				<h2>Serviços que oferecemos</h2>
				<Carrossel />
			</section>
		</>
	)
}