import Banner from './components/Banner'
import Atendimento from './components/Atendimento'
import Funcionamento from './components/Funcionamento'

export default function Home() {
  return (
    <main>
      <Banner page={'home'} />
      <section>SUA TRANQUILIDADE EM BOAS MÃOS</section> {/*Sugiro criar um png com fundo transparente com o texto e imagem dessa parte */}
      <Atendimento />
      <section>
        Serviço de ambulância particular para atendimentos, remoções, altas e exames emergenciais.
      </section>
      <Funcionamento />
      <section>
        <section>ESPECIALIDADES</section>
        <section>Remoção, Transporte e Atendimento médico</section>
      </section>
      <section>
        <section>A FROTA</section>
        <section>Nossa frota grante eficiência para qualquer tipo de emergência</section>
      </section>
      <section>
        <section>CREDEINCIAMENTO</section>
        <section>Oferecemos toda a segurança de um profissionalismo credenciado</section>
      </section>
      <section>
        <section>A EQUIPE</section>
        <section>Infraestrutura sob comando de profissionais qualificados</section>
      </section>
      <section>Serviços que oferecemos</section>
      {/* carrossel */}
    </main>
  )
}