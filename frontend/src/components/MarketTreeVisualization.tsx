import React, { useCallback, useMemo } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  Position,
  addEdge,
  MiniMap,
  BackgroundVariant
} from 'reactflow';
import type { Node, Edge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import type { MarketTree, Market } from '../types';
import { formatCurrency, formatTimeRemaining } from '../utils';

interface MarketTreeVisualizationProps {
  marketTree: MarketTree[];
  onMarketClick: (marketId: string) => void;
  selectedMarketId?: string;
}

interface MarketNodeData {
  market: Market;
  isSelected: boolean;
  onClick: (marketId: string) => void;
}

const MarketNode: React.FC<{ data: MarketNodeData }> = ({ data }) => {
  const { market, isSelected, onClick } = data;
  const isExpired = new Date() > market.expiryTime;

  return (
    <div
      className={`p-4 rounded-lg border-2 bg-white shadow-md cursor-pointer transition-all duration-200 min-w-[250px] max-w-[300px] ${
        isSelected
          ? 'border-primary-500 shadow-lg'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
      }`}
      onClick={() => onClick(market.id)}
    >
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">
          {market.question}
        </h4>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatCurrency(market.totalStaked)}</span>
          <span>{isExpired ? 'Expired' : formatTimeRemaining(market.expiryTime)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {market.outcomes.slice(0, 2).map((outcome, _index) => (
              <div
                key={outcome}
                className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 truncate"
                style={{ maxWidth: '80px' }}
              >
                {outcome}
              </div>
            ))}
            {market.outcomes.length > 2 && (
              <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                +{market.outcomes.length - 2}
              </div>
            )}
          </div>
          
          {market.resolved && (
            <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
              Resolved
            </div>
          )}
        </div>
        
        {market.childMarkets.length > 0 && (
          <div className="text-xs text-primary-600 font-medium">
            {market.childMarkets.length} sub-market{market.childMarkets.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  marketNode: MarketNode,
};

const MarketTreeVisualization: React.FC<MarketTreeVisualizationProps> = ({
  marketTree,
  onMarketClick,
  selectedMarketId,
}) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const processTree = (tree: MarketTree[], parentId?: string, level = 0, siblingIndex = 0) => {
      tree.forEach((item, index) => {
        const nodeId = item.market.id;
        const x = siblingIndex * 350;
        const y = level * 200;
        
        nodes.push({
          id: nodeId,
          type: 'marketNode',
          position: { x, y },
          data: {
            market: item.market,
            isSelected: selectedMarketId === nodeId,
            onClick: onMarketClick,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
        
        if (parentId) {
          edges.push({
            id: `${parentId}-${nodeId}`,
            source: parentId,
            target: nodeId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#6366f1', strokeWidth: 2 },
          });
        }
        
        if (item.children.length > 0) {
          processTree(item.children, nodeId, level + 1, index * item.children.length);
        }
      });
    };
    
    processTree(marketTree);
    
    return { nodes, edges };
  }, [marketTree, selectedMarketId, onMarketClick]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes when selectedMarketId changes
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isSelected: selectedMarketId === node.id,
        },
      }))
    );
  }, [selectedMarketId, setNodes]);

  if (marketTree.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Markets Found</h3>
          <p className="text-gray-500">Create your first market to see the tree visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls />
        <MiniMap
          nodeColor={(node: Node) => {
            if (node.data?.isSelected) return '#6366f1';
            return '#e5e7eb';
          }}
          className="bg-white"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      </ReactFlow>
    </div>
  );
};

export default MarketTreeVisualization;