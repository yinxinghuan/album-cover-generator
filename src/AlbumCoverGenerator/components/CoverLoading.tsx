import Ticket from './Ticket';
import { t } from '../i18n';

interface Props {
  stage: '' | 'naming' | 'pressing';
}

export default function CoverLoading({ stage: _stage }: Props) {
  return (
    <Ticket topLabel={t('ticket_label_pressing')} catalog="ALT-???" footerHero={t('footer_hero_in')}>
      <div className="acg-cover-panel acg-cover-panel--pressing">
        <div className="acg-spinner is-spinning">
          <div className="acg-spinner__label" />
          <div className="acg-spinner__hole" />
        </div>
      </div>

      <div className="acg-result-headline">
        <h1 className="acg-display acg-display--xl">{t('loading_status')}</h1>
        <h2 className="acg-display acg-display--lg acg-display--orange">{t('loading_sub')}</h2>
      </div>

      <div className="acg-perf" />

      <div className="acg-loading-bar"><span /></div>
    </Ticket>
  );
}
