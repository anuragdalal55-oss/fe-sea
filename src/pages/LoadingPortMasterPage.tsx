import React from 'react';
import PortMasterPage from './PortMasterPage';

const LoadingPortMasterPage: React.FC = () => (
  <PortMasterPage
    endpoint="/sea-loading-ports"
    title="Loading Port Master"
    subtitle="Create and manage non-Indian ports of loading. Used by the Loading Port field on the MBL entry form."
    codePlaceholder="e.g. SGSIN"
    namePlaceholder="e.g. SINGAPORE"
  />
);

export default LoadingPortMasterPage;
