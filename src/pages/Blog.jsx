import { Header } from '../components/layout/Header';
import { Panel, PanelHeader } from '../components/layout/Panel';

export const Blog = () => {
  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      <div className="orb orb-one"></div>
      <div className="orb orb-two"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Header />

        <Panel className="mt-4">
          <PanelHeader
            title="Blog"
            subtitle="Conseils et astuces pour tes plantes"
          />
          <div className="py-16 text-center">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-lg font-medium text-ink/70">Section à venir</p>
            <p className="text-sm text-ink/50 mt-2">
              Des articles et conseils de jardinage seront bientôt publiés ici.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
};
