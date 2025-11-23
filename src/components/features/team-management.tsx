import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { 
  Users, 
  Plus, 
  Mail, 
  Copy, 
  QrCode,
  Shield,
  Activity,
  MoreVertical,
  UserPlus
} from "lucide-react";
import { RoleChip } from "../shared/role-chip";
import { StatusChip } from "../shared/status-chip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface TeamMember {
  id: string;
  name: string;
  role: "security" | "logistics" | "medical" | "organizer" | "volunteer";
  status: "online" | "offline";
  lastSeen: string;
  assignment?: string;
}

interface Team {
  id: string;
  name: string;
  role: "security" | "logistics" | "medical" | "organizer" | "volunteer";
  members: TeamMember[];
  permissions: string[];
}

const allPermissions = [
  { id: "viewHeatmap", label: "View Heatmap", description: "Access crowd density visualizations" },
  { id: "dispatch", label: "Dispatch Teams", description: "Send teams to incidents" },
  { id: "viewTeamLocations", label: "View Team Locations", description: "Track team member positions" },
  { id: "manageSchedule", label: "Manage Schedule", description: "Edit team schedules and shifts" },
  { id: "createAlerts", label: "Create Alerts", description: "Generate safety alerts" },
  { id: "viewAnalytics", label: "View Analytics", description: "Access event analytics and reports" },
  { id: "manageZones", label: "Manage Zones", description: "Edit venue zones and boundaries" },
  { id: "exportData", label: "Export Data", description: "Download event data and logs" },
];

export function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([
    {
      id: "1",
      name: "Security Alpha",
      role: "security",
      members: [
        { id: "1", name: "John Smith", role: "security", status: "online", lastSeen: "Active now", assignment: "Main Gate" },
        { id: "2", name: "Sarah Johnson", role: "security", status: "online", lastSeen: "Active now", assignment: "Stage Area" },
      ],
      permissions: ["viewHeatmap", "dispatch", "viewTeamLocations", "createAlerts"],
    },
    {
      id: "2",
      name: "Medical Response",
      role: "medical",
      members: [
        { id: "3", name: "Dr. Emily Chen", role: "medical", status: "online", lastSeen: "Active now", assignment: "Medical Tent" },
      ],
      permissions: ["viewHeatmap", "viewTeamLocations", "createAlerts"],
    },
    {
      id: "3",
      name: "Logistics Team",
      role: "logistics",
      members: [
        { id: "4", name: "Mike Rodriguez", role: "logistics", status: "offline", lastSeen: "2 hours ago" },
      ],
      permissions: ["viewHeatmap", "manageSchedule", "viewTeamLocations"],
    },
  ]);
  
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showNewTeamDialog, setShowNewTeamDialog] = useState(false);

  const selectedTeamData = teams.find(t => t.id === selectedTeam);
  const onlineCount = teams.reduce((acc, team) => 
    acc + team.members.filter(m => m.status === "online").length, 0
  );
  const totalMembers = teams.reduce((acc, team) => acc + team.members.length, 0);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Team & Role Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage teams, assign roles, and configure permissions
            </p>
          </div>
          
          <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#FF6A00] hover:bg-[#FF6A00]/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <TeamBuilder onClose={() => setShowNewTeamDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground">Total Teams</p>
                <p className="text-foreground">{teams.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground">Total Members</p>
                <p className="text-foreground">{totalMembers}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#16A34A]/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#16A34A]" />
              </div>
              <div>
                <p className="text-muted-foreground">Online Now</p>
                <p className="text-foreground">{onlineCount}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground">Role Types</p>
                <p className="text-foreground">5</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList>
            <TabsTrigger value="teams">Teams Overview</TabsTrigger>
            <TabsTrigger value="members">All Members</TabsTrigger>
            <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => {
                const onlineMembers = team.members.filter(m => m.status === "online").length;
                return (
                  <Card key={team.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3>{team.name}</h3>
                          <RoleChip role={team.role} />
                        </div>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{team.members.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4 text-[#16A34A]" />
                          <span>{onlineMembers} online</span>
                        </div>
                      </div>

                      <div className="flex -space-x-2">
                        {team.members.slice(0, 4).map((member) => (
                          <Avatar key={member.id} className="border-2 border-card">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {team.members.length > 4 && (
                          <div className="w-10 h-10 rounded-full border-2 border-card bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground">+{team.members.length - 4}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setSelectedTeam(team.id)}
                        >
                          View Details
                        </Button>
                        <Button size="icon" variant="outline">
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4">Member</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Team</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Assignment</th>
                      <th className="p-4">Last Seen</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.flatMap(team =>
                      team.members.map(member => (
                        <tr key={member.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{member.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <RoleChip role={member.role} />
                          </td>
                          <td className="p-4">{team.name}</td>
                          <td className="p-4">
                            <StatusChip status={member.status} showIcon />
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {member.assignment || "Unassigned"}
                          </td>
                          <td className="p-4 text-muted-foreground">{member.lastSeen}</td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm">
                              Reassign
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3>Permission Matrix</h3>
                  <p className="text-muted-foreground mt-1">
                    Configure role-based access controls
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-3">Permission</th>
                        <th className="text-center p-3">Security</th>
                        <th className="text-center p-3">Logistics</th>
                        <th className="text-center p-3">Medical</th>
                        <th className="text-center p-3">Organizer</th>
                        <th className="text-center p-3">Volunteer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPermissions.map((perm) => (
                        <tr key={perm.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div>
                              <p className="text-foreground">{perm.label}</p>
                              <p className="text-muted-foreground">{perm.description}</p>
                            </div>
                          </td>
                          {["security", "logistics", "medical", "organizer", "volunteer"].map((role) => (
                            <td key={role} className="text-center p-3">
                              <input
                                type="checkbox"
                                defaultChecked={Math.random() > 0.5}
                                className="w-5 h-5"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">Reset to Defaults</Button>
                  <Button className="bg-[#16A34A] hover:bg-[#16A34A]/90">
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TeamBuilder({ onClose }: { onClose: () => void }) {
  const [inviteLink] = useState("https://eventsafety.app/invite/abc123");
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="team-name">Team Name</Label>
          <Input id="team-name" placeholder="Enter team name" />
        </div>

        <div className="space-y-2">
          <Label>Default Role</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </Button>
            <Button variant="outline" className="justify-start">
              <Activity className="w-4 h-4 mr-2" />
              Medical
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="w-4 h-4 mr-2" />
              Logistics
            </Button>
            <Button variant="outline" className="justify-start">
              <UserPlus className="w-4 h-4 mr-2" />
              Volunteer
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Default Permissions</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allPermissions.slice(0, 4).map((perm) => (
              <div key={perm.id} className="flex items-center gap-2">
                <input type="checkbox" id={perm.id} className="w-4 h-4" />
                <Label htmlFor={perm.id} className="font-normal cursor-pointer">
                  {perm.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t">
        <Label>Invite Team Members</Label>
        <div className="flex gap-2">
          <Input value={inviteLink} readOnly />
          <Button size="icon" variant="outline">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <QrCode className="w-4 h-4 mr-2" />
            Show QR Code
          </Button>
          <Button variant="outline" className="flex-1">
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button className="bg-[#FF6A00] hover:bg-[#FF6A00]/90" onClick={onClose}>
          Create Team
        </Button>
      </div>
    </div>
  );
}
