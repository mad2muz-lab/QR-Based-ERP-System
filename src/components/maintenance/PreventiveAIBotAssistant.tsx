import React, { useState, useEffect } from 'react';
import { preventiveMaintenanceService, PreventiveMaintenanceLog, PreventiveMaintenanceType } from '../../utils/preventiveMaintenanceService';
import { supabase } from '../../utils/supabaseClient';

// Define the possible bot states
const BOT_STATES = {
  WELCOME: 'WELCOME',
  VIEW_LOGS: 'VIEW_LOGS',
  SCHEDULE: 'SCHEDULE',
  COMPLETE: 'COMPLETE',
  LOG_DETAILS: 'LOG_DETAILS',
  SELECT_TYPE: 'SELECT_TYPE',
  SELECT_DATE: 'SELECT_DATE',
  ASSIGN_TECH: 'ASSIGN_TECH',
  CONFIRM_SCHEDULE: 'CONFIRM_SCHEDULE',
  CHECKLIST: 'CHECKLIST',
  NOTES: 'NOTES',
  CONFIRM_COMPLETE: 'CONFIRM_COMPLETE',
  DONE: 'DONE',
};

type BotState = keyof typeof BOT_STATES;

// Mock technician list (replace with real employee fetch later)
const mockTechnicians = [
  { id: 'tech1', name: 'Alice Technician' },
  { id: 'tech2', name: 'Bob Mechanic' },
  { id: 'tech3', name: 'Charlie Engineer' },
];

const predefinedNotes = [
  'No issues found',
  'Minor wear detected',
  'Requires follow-up',
  'All checks passed',
  'Parts replaced',
  'Further inspection needed',
];

const PreventiveAIBotAssistant: React.FC<{ equipmentId?: string }> = ({ equipmentId }) => {
  const [state, setState] = useState<BotState>('WELCOME');
  const [logs, setLogs] = useState<PreventiveMaintenanceLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<PreventiveMaintenanceLog | null>(null);
  const [types, setTypes] = useState<PreventiveMaintenanceType[]>([]);
  const [selectedType, setSelectedType] = useState<PreventiveMaintenanceType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<{ id: string; name: string } | null>(null);
  const [messages, setMessages] = useState<Array<{ from: 'bot' | 'user'; text: string }>>([
    { from: 'bot', text: 'Welcome! What would you like to do?' },
  ]);
  const [loading, setLoading] = useState(false);
  // Checklist state
  const [checklist, setChecklist] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<{ [item: string]: boolean }>({});
  // Spare parts state
  const [spareParts, setSpareParts] = useState<string[]>([]);
  const [usedParts, setUsedParts] = useState<{ [part: string]: boolean }>({});
  // Notes state
  const [selectedNotes, setSelectedNotes] = useState<{ [note: string]: boolean }>({});
  // Notification state
  const [userId, setUserId] = useState<string>('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifSummary, setNotifSummary] = useState<{ dueSoon: number; overdue: number }>({ dueSoon: 0, overdue: 0 });

  // Fetch current user ID and notifications on mount
  useEffect(() => {
    async function fetchUserAndNotifications() {
      // Get user ID from Supabase auth
      const { data, error } = await supabase.auth.getUser();
      let uid = '';
      if (data && data.user) {
        uid = data.user.id;
        setUserId(uid);
      } else {
        // Mock user ID if not available
        uid = 'mock-user-id';
        setUserId(uid);
      }
      // Fetch notifications for this user
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .in('type', ['pm_due_soon', 'pm_overdue'])
        .eq('is_read', false)
        .order('created_at', { ascending: false });
      setNotifications(notifData || []);
      setNotifSummary({
        dueSoon: (notifData || []).filter((n: any) => n.type === 'pm_due_soon').length,
        overdue: (notifData || []).filter((n: any) => n.type === 'pm_overdue').length,
      });
    }
    fetchUserAndNotifications();
  }, []);

  // Helper to acknowledge (mark as read) a notification
  const acknowledgeNotification = async (notifId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    setNotifSummary((prev) => {
      const notif = notifications.find((n) => n.id === notifId);
      if (!notif) return prev;
      return {
        dueSoon: notif.type === 'pm_due_soon' ? prev.dueSoon - 1 : prev.dueSoon,
        overdue: notif.type === 'pm_overdue' ? prev.overdue - 1 : prev.overdue,
      };
    });
  };

  // Handler for user actions
  const handleAction = async (action: string) => {
    addMessage('user', action);
    switch (state) {
      case 'WELCOME':
        if (action === 'View Logs') {
          setState('VIEW_LOGS');
          addMessage('bot', 'Fetching preventive maintenance logs...');
          if (equipmentId) {
            setLoading(true);
            const { data } = await preventiveMaintenanceService.getLogsForEquipment(equipmentId);
            setLogs(data || []);
            setLoading(false);
            addMessage('bot', data && data.length > 0 ? 'Here are your logs. Select one for details or schedule new.' : 'No logs found. Would you like to schedule new maintenance?');
          } else {
            addMessage('bot', 'No equipment selected.');
          }
        } else if (action === 'Schedule Maintenance') {
          setState('SCHEDULE');
          addMessage('bot', 'Let’s schedule preventive maintenance. Select type:');
          setTypes([
            { id: 'type_a', name: 'A Service', description: 'Light check', checklist_items: ['Check oil', 'Inspect belts'], spare_parts: ['Oil filter'] },
            { id: 'type_b', name: 'B Service', description: 'Medium check', checklist_items: ['Replace filter', 'Check coolant'], spare_parts: ['Air filter', 'Coolant'] },
            { id: 'type_c', name: 'C Service', description: 'Full overhaul', checklist_items: ['Overhaul engine', 'Replace hoses'], spare_parts: ['Engine kit', 'Hoses'] },
          ]);
          setState('SELECT_TYPE');
        }
        break;
      case 'VIEW_LOGS':
        if (action === 'Schedule New') {
          setState('SCHEDULE');
          addMessage('bot', 'Let’s schedule preventive maintenance. Select type:');
          setTypes([
            { id: 'type_a', name: 'A Service', description: 'Light check', checklist_items: ['Check oil', 'Inspect belts'], spare_parts: ['Oil filter'] },
            { id: 'type_b', name: 'B Service', description: 'Medium check', checklist_items: ['Replace filter', 'Check coolant'], spare_parts: ['Air filter', 'Coolant'] },
            { id: 'type_c', name: 'C Service', description: 'Full overhaul', checklist_items: ['Overhaul engine', 'Replace hoses'], spare_parts: ['Engine kit', 'Hoses'] },
          ]);
          setState('SELECT_TYPE');
        } else {
          // Assume action is log id
          const log = logs.find((l) => l.id === action);
          if (log) {
            setSelectedLog(log);
            setState('LOG_DETAILS');
            addMessage('bot', `Log Details:\nType: ${log.preventive_type_id}\nStatus: ${log.status}`);
          }
        }
        break;
      case 'LOG_DETAILS':
        if (action === 'Complete This' && selectedLog) {
          setState('CHECKLIST');
          addMessage('bot', 'Fetching checklist and spare parts for completion...');
          setLoading(true);
          const { data } = await preventiveMaintenanceService.getTypeDetails(selectedLog.preventive_type_id);
          setLoading(false);
          if (data) {
            // Checklist
            if (Array.isArray(data.checklist_items)) {
              setChecklist(data.checklist_items);
              setCheckedItems(Object.fromEntries(data.checklist_items.map((item: string) => [item, false])));
            } else {
              setChecklist([]);
              setCheckedItems({});
            }
            // Spare parts
            if (Array.isArray(data.spare_parts)) {
              setSpareParts(data.spare_parts);
              setUsedParts(Object.fromEntries(data.spare_parts.map((part: string) => [part, false])));
            } else {
              setSpareParts([]);
              setUsedParts({});
            }
            addMessage('bot', 'Please complete the checklist and mark used spare parts:');
          } else {
            setChecklist([]);
            setCheckedItems({});
            setSpareParts([]);
            setUsedParts({});
            addMessage('bot', 'No checklist or spare parts found for this type.');
          }
        }
        break;
      case 'CHECKLIST':
        // action is the checklist or spare part item toggled
        if (checklist.includes(action)) {
          setCheckedItems((prev) => ({ ...prev, [action]: !prev[action] }));
        } else if (spareParts.includes(action)) {
          setUsedParts((prev) => ({ ...prev, [action]: !prev[action] }));
        } else if (action === 'Checklist Done') {
          setState('NOTES');
          addMessage('bot', 'Select any relevant notes for this maintenance:');
          setSelectedNotes({});
        }
        break;
      case 'NOTES':
        // action is a note toggled
        setSelectedNotes((prev) => ({ ...prev, [action]: !prev[action] }));
        break;
      case 'CONFIRM_COMPLETE':
        if (action === 'Confirm Completion' && selectedLog) {
          setLoading(true);
          const notesArr = Object.entries(selectedNotes).filter(([_, v]) => v).map(([k]) => k);
          const { error } = await preventiveMaintenanceService.updateLog(selectedLog.id, {
            status: 'completed',
            completed_date: new Date().toISOString(),
            checklist_completed: true,
            notes: notesArr.join(', '),
          });
          setLoading(false);
          if (!error) {
            setState('DONE');
            addMessage('bot', 'Checklist, spare parts, and notes completed. Maintenance log marked as completed!');
          } else {
            addMessage('bot', 'Error updating log. Please try again.');
          }
        }
        break;
      case 'SELECT_TYPE':
        const type = types.find((t) => t.name === action);
        if (type) {
          setSelectedType(type);
          setState('SELECT_DATE');
          addMessage('bot', `Selected: ${type.name}. Now pick a date for scheduling.`);
        }
        break;
      case 'SELECT_DATE':
        if (action === 'Confirm Date' && selectedDate) {
          setState('ASSIGN_TECH');
          addMessage('bot', 'Select a technician to assign:');
        }
        break;
      case 'ASSIGN_TECH':
        const tech = mockTechnicians.find((t) => t.name === action);
        if (tech) {
          setSelectedTech(tech);
          setState('CONFIRM_SCHEDULE');
          addMessage('bot', `Ready to schedule: ${selectedType?.name} on ${selectedDate} with ${tech.name}. Confirm?`);
        }
        break;
      case 'CONFIRM_SCHEDULE':
        if (action === 'Confirm Schedule' && equipmentId && selectedType && selectedDate && selectedTech) {
          setLoading(true);
          const { data, error } = await preventiveMaintenanceService.createLog({
            equipment_id: equipmentId,
            preventive_type_id: selectedType.id,
            scheduled_date: selectedDate,
            technician_id: selectedTech.id,
            status: 'scheduled',
          });
          setLoading(false);
          if (!error) {
            setState('DONE');
            addMessage('bot', 'Preventive maintenance scheduled successfully!');
          } else {
            addMessage('bot', 'Error scheduling maintenance. Please try again.');
          }
        }
        break;
      case 'DONE':
        setState('WELCOME');
        setSelectedType(null);
        setSelectedDate('');
        setSelectedTech(null);
        setSelectedLog(null);
        setChecklist([]);
        setCheckedItems({});
        setSpareParts([]);
        setUsedParts({});
        setSelectedNotes({});
        addMessage('bot', 'What would you like to do next?');
        break;
      default:
        addMessage('bot', 'This step is not implemented yet.');
        break;
    }
  };

  // Render options based on state
  const renderOptions = () => {
    switch (state) {
      case 'WELCOME':
        return [
          <button key="view" onClick={() => handleAction('View Logs')}>View Logs</button>,
          <button key="schedule" onClick={() => handleAction('Schedule Maintenance')}>Schedule Maintenance</button>,
        ];
      case 'VIEW_LOGS':
        return [
          ...logs.map((log) => (
            <button key={log.id} onClick={() => handleAction(log.id)}>
              {log.preventive_type_id} - {log.status}
            </button>
          )),
          <button key="schedule-new" onClick={() => handleAction('Schedule New')}>Schedule New</button>,
        ];
      case 'LOG_DETAILS':
        return [<button key="complete" onClick={() => handleAction('Complete This')}>Complete This</button>];
      case 'CHECKLIST':
        return [
          <div key="checklist-group" style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Checklist:</div>
            {checklist.map((item) => (
              <label key={item} style={{ display: 'block', marginBottom: 4 }}>
                <input
                  type="checkbox"
                  checked={!!checkedItems[item]}
                  onChange={() => handleAction(item)}
                  style={{ marginRight: 8 }}
                />
                {item}
              </label>
            ))}
            <div style={{ fontWeight: 'bold', margin: '8px 0 4px 0' }}>Spare Parts Used:</div>
            {spareParts.map((part) => (
              <label key={part} style={{ display: 'block', marginBottom: 4 }}>
                <input
                  type="checkbox"
                  checked={!!usedParts[part]}
                  onChange={() => handleAction(part)}
                  style={{ marginRight: 8 }}
                />
                {part}
              </label>
            ))}
          </div>,
          <button
            key="checklist-done"
            onClick={() => handleAction('Checklist Done')}
            disabled={
              !checklist.length || !checklist.every((item) => checkedItems[item]) ||
              (spareParts.length > 0 && !spareParts.every((part) => usedParts[part]))
            }
          >
            Next: Add Notes
          </button>,
        ];
      case 'NOTES':
        return [
          <div key="notes-group" style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Select Notes:</div>
            {predefinedNotes.map((note) => (
              <label key={note} style={{ display: 'block', marginBottom: 4 }}>
                <input
                  type="checkbox"
                  checked={!!selectedNotes[note]}
                  onChange={() => handleAction(note)}
                  style={{ marginRight: 8 }}
                />
                {note}
              </label>
            ))}
          </div>,
          <button
            key="confirm-complete"
            onClick={() => setState('CONFIRM_COMPLETE')}
            disabled={!Object.values(selectedNotes).some(Boolean)}
          >
            Confirm Completion
          </button>,
        ];
      case 'CONFIRM_COMPLETE':
        return [
          <button key="confirm-completion" onClick={() => handleAction('Confirm Completion')}>Confirm Completion</button>,
        ];
      case 'SELECT_TYPE':
        return types.map((type) => (
          <button key={type.id} onClick={() => handleAction(type.name)}>{type.name}</button>
        ));
      case 'SELECT_DATE':
        return [
          <input
            key="date-picker"
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ marginBottom: 8 }}
          />,
          <button key="confirm-date" onClick={() => handleAction('Confirm Date')} disabled={!selectedDate}>Confirm Date</button>,
        ];
      case 'ASSIGN_TECH':
        return mockTechnicians.map((tech) => (
          <button key={tech.id} onClick={() => handleAction(tech.name)}>{tech.name}</button>
        ));
      case 'CONFIRM_SCHEDULE':
        return [
          <button key="confirm-schedule" onClick={() => handleAction('Confirm Schedule')}>Confirm Schedule</button>,
        ];
      case 'DONE':
        return [
          <button key="next" onClick={() => handleAction('Next')}>Next</button>,
        ];
      default:
        return null;
    }
  };

  // Render notification summary and list (in WELCOME state)
  const renderNotificationSummary = () => {
    if (notifSummary.dueSoon === 0 && notifSummary.overdue === 0) return null;
    return (
      <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 6, padding: 8, marginBottom: 12 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
          {`You have ${notifSummary.dueSoon} PM task(s) due soon and ${notifSummary.overdue} overdue!`}
        </div>
        {notifications.map((notif) => (
          <div key={notif.id} style={{ marginBottom: 6, padding: 6, background: '#fff1f0', borderRadius: 4 }}>
            <div style={{ fontSize: 13 }}>{notif.title}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{notif.message}</div>
            <div style={{ marginTop: 4 }}>
              <button style={{ marginRight: 8 }} onClick={() => acknowledgeNotification(notif.id)}>Acknowledge</button>
              <a href={notif.action_url} target="_blank" rel="noopener noreferrer">
                <button>View Details</button>
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 400, border: '1px solid #ccc', borderRadius: 8, padding: 16, background: '#fafbfc' }}>
      <div style={{ minHeight: 200, marginBottom: 16 }}>
        {state === 'WELCOME' && renderNotificationSummary()}
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.from === 'bot' ? 'left' : 'right', margin: '8px 0' }}>
            <span style={{ background: msg.from === 'bot' ? '#e6f7ff' : '#d9f7be', padding: '6px 12px', borderRadius: 16, display: 'inline-block' }}>{msg.text}</span>
          </div>
        ))}
        {loading && <div style={{ color: '#888', fontStyle: 'italic' }}>Processing...</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {renderOptions()}
      </div>
    </div>
  );
};

export default PreventiveAIBotAssistant; 