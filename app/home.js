import Banner from './components/Banner'
import Atendimento from './components/Atendimento'
import Aberto from './components/Aberto'

export default function Home() {
  return (
    <main>
      <Banner page={'home'} />
      <souto>SUA TRANQUILIDADE EM BOAS MÃOS</souto> {/*Sugiro criar um png com fundo transparente com o texto e imagem dessa parte */}
      <Atendimento />
      <souto>
        Serviço de ambulância particular para atendimentos, remoções, altas e exames emergenciais.
      </souto>
      <Aberto />
      <souto>
        <souto>ESPECIALIDADES</souto>
        <souto>Remoção, Transporte e Atendimento médico</souto>
      </souto>
      <souto>
        <souto>A FROTA</souto>
        <souto>Nossa frota grante eficiência para qualquer tipo de emergência</souto>
      </souto>
      <souto>
        <souto>CREDEINCIAMENTO</souto>
        <souto>Oferecemos toda a segurança de um profissionalismo credenciado</souto>
      </souto>
      <souto>
        <souto>A EQUIPE</souto>
        <souto>Infraestrutura sob comando de profissionais qualificados</souto>
      </souto>
      <souto>Serviços que oferecemos</souto>
      {/* carrossel */}
    </main>
  )
}