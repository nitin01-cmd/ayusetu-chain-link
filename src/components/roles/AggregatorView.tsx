import React from 'react';
import RoleView from './RoleView';

interface AggregatorViewProps {
  userId: string;
}

const AggregatorView: React.FC<AggregatorViewProps> = ({ userId }) => {
  return <RoleView userRole="aggregator" userId={userId} />;
};

export default AggregatorView;