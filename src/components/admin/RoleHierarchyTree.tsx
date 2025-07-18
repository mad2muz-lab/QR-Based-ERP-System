import React from 'react';
import { Role } from '../../types';

interface RoleHierarchyTreeProps {
  roles: Role[];
}

function buildTree(roles: Role[]) {
  const map: Record<string, Role & { children: Role[] }> = {};
  roles.forEach(r => (map[r.id] = { ...r, children: [] }));
  const roots: (Role & { children: Role[] })[] = [];
  roles.forEach(r => {
    if (r.parent_role_id && map[r.parent_role_id]) {
      map[r.parent_role_id].children.push(map[r.id]);
    } else {
      roots.push(map[r.id]);
    }
  });
  return roots;
}

const RoleHierarchyTree: React.FC<RoleHierarchyTreeProps> = ({ roles }) => {
  const tree = buildTree(roles);
  function renderNode(role: Role & { children: Role[] }, level = 0) {
    return (
      <div key={role.id} style={{ marginLeft: level * 24 }} className="mb-1">
        <span className="font-semibold">{role.name}</span>
        {role.description && <span className="text-gray-500 ml-2 text-xs">({role.description})</span>}
        {role.children.length > 0 && (
          <div className="ml-4 border-l border-gray-200 pl-2 mt-1">
            {role.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-2">Role Hierarchy</h3>
      {tree.length === 0 ? <div className="text-gray-500">No roles defined.</div> : tree.map(r => renderNode(r))}
    </div>
  );
};

export default RoleHierarchyTree; 