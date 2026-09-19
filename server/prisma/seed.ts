import { PrismaClient, ExperienceLevel, ProjectRole, MemberStatus, ProjectStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database for TeamUp...');

  // 1. Seed Skills
  const skillNames = [
    { name: 'React Native', category: 'Mobile' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Python', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'NestJS', category: 'Backend' },
    { name: 'Figma', category: 'Design' },
    { name: 'UI/UX', category: 'Design' },
    { name: 'Flutter', category: 'Mobile' },
    { name: 'Docker', category: 'DevOps' },
  ];

  const skillMap: Record<string, string> = {};
  for (const s of skillNames) {
    const skill = await prisma.skill.upsert({
      where: { name: s.name },
      update: { category: s.category },
      create: { name: s.name, category: s.category },
    });
    skillMap[s.name] = skill.id;
  }
  console.log('Skills seeded:', Object.keys(skillMap).length);

  // 2. Ensure test user (project creator)
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  const creatorUser = await prisma.user.upsert({
    where: { email: 'testuser@example.com' },
    update: {},
    create: {
      email: 'testuser@example.com',
      password: defaultPasswordHash,
      profile: {
        create: {
          fullName: 'Mahin Khan',
          bio: 'CS Student & TeamUp Creator',
          department: 'Computer Science',
          semester: 'Fall 2026',
          experienceLevel: ExperienceLevel.ADVANCED,
          availability: true,
        },
      },
    },
  });

  // 3. Seed Candidate Users for Skill-Based Matching
  const candidatesData = [
    {
      email: 'alice@university.edu',
      fullName: 'Alice Johnson',
      bio: 'Fullstack React Native & Node developer passionate about building smooth mobile apps.',
      department: 'Computer Science',
      semester: 'Fall 2026',
      experienceLevel: ExperienceLevel.ADVANCED,
      githubUsername: 'alicejohnson',
      githubStats: {
        publicRepos: 24,
        contributionsThisYear: 350,
        totalStars: 45,
        topLanguages: ['TypeScript', 'JavaScript', 'Python'],
      },
      skills: [
        { name: 'React Native', proficiency: ExperienceLevel.ADVANCED, years: 3 },
        { name: 'TypeScript', proficiency: ExperienceLevel.ADVANCED, years: 3 },
        { name: 'Node.js', proficiency: ExperienceLevel.INTERMEDIATE, years: 2 },
      ],
    },
    {
      email: 'bob@university.edu',
      fullName: 'Bob Smith',
      bio: 'Frontend designer and UI enthusiast. Love crafting delightful user interfaces with Figma and React Native.',
      department: 'Software Engineering',
      semester: 'Spring 2026',
      experienceLevel: ExperienceLevel.INTERMEDIATE,
      githubUsername: 'bobsmith',
      githubStats: {
        publicRepos: 12,
        contributionsThisYear: 180,
        totalStars: 15,
        topLanguages: ['JavaScript', 'TypeScript'],
      },
      skills: [
        { name: 'React Native', proficiency: ExperienceLevel.INTERMEDIATE, years: 2 },
        { name: 'Figma', proficiency: ExperienceLevel.ADVANCED, years: 2 },
        { name: 'UI/UX', proficiency: ExperienceLevel.ADVANCED, years: 2 },
      ],
    },
    {
      email: 'charlie@university.edu',
      fullName: 'Charlie Davis',
      bio: 'Data scientist and backend enthusiast. Experienced with Python, Docker, and PostgreSQL databases.',
      department: 'Data Science',
      semester: 'Fall 2026',
      experienceLevel: ExperienceLevel.BEGINNER,
      githubUsername: 'charliedavis',
      githubStats: {
        publicRepos: 8,
        contributionsThisYear: 95,
        totalStars: 5,
        topLanguages: ['Python', 'SQL'],
      },
      skills: [
        { name: 'Python', proficiency: ExperienceLevel.INTERMEDIATE, years: 1.5 },
        { name: 'PostgreSQL', proficiency: ExperienceLevel.BEGINNER, years: 1 },
        { name: 'Docker', proficiency: ExperienceLevel.BEGINNER, years: 1 },
      ],
    },
  ];

  for (const c of candidatesData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        password: defaultPasswordHash,
        profile: {
          create: {
            fullName: c.fullName,
            bio: c.bio,
            department: c.department,
            semester: c.semester,
            experienceLevel: c.experienceLevel,
            availability: true,
            githubUsername: c.githubUsername,
            githubStats: c.githubStats,
          },
        },
      },
      include: { profile: true },
    });

    if (user.profile) {
      for (const s of c.skills) {
        const skillId = skillMap[s.name];
        if (skillId) {
          await prisma.profileSkill.upsert({
            where: {
              profileId_skillId: {
                profileId: user.profile.id,
                skillId,
              },
            },
            update: {
              proficiencyLevel: s.proficiency,
              yearsOfExperience: s.years,
            },
            create: {
              profileId: user.profile.id,
              skillId,
              proficiencyLevel: s.proficiency,
              yearsOfExperience: s.years,
            },
          });
        }
      }
    }
  }
  console.log('Candidates seeded successfully');

  // 4. Seed Project 'project-1'
  const project1 = await prisma.project.upsert({
    where: { id: 'project-1' },
    update: {
      title: 'AI Study Buddy & Collaboration Hub',
      description:
        'Building a real-time collaborative study platform with AI-powered tutoring, teammate recommendation, and calendar scheduling.',
      domain: 'Education & AI',
      semester: 'Fall 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 4,
    },
    create: {
      id: 'project-1',
      title: 'AI Study Buddy & Collaboration Hub',
      description:
        'Building a real-time collaborative study platform with AI-powered tutoring, teammate recommendation, and calendar scheduling.',
      domain: 'Education & AI',
      semester: 'Fall 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      creatorId: creatorUser.id,
      members: {
        create: {
          userId: creatorUser.id,
          role: ProjectRole.LEADER,
          status: MemberStatus.ACCEPTED,
        },
      },
      requiredSkills: {
        create: [
          {
            skillId: skillMap['React Native'],
            minimumExperience: ExperienceLevel.INTERMEDIATE,
          },
          {
            skillId: skillMap['TypeScript'],
            minimumExperience: ExperienceLevel.BEGINNER,
          },
          {
            skillId: skillMap['Node.js'],
            minimumExperience: ExperienceLevel.INTERMEDIATE,
          },
        ],
      },
    },
  });
  console.log('Project-1 seeded:', project1.id);

  // 5. Seed Additional Projects (for Search & Bookmarks)
  await prisma.project.upsert({
    where: { id: 'project-2' },
    update: {},
    create: {
      id: 'project-2',
      title: 'Campus Food Delivery & Meal Share',
      description:
        'Peer-to-peer campus food ordering and grocery delivery app connecting students.',
      domain: 'Logistics & Community',
      semester: 'Fall 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      creatorId: creatorUser.id,
      members: {
        create: {
          userId: creatorUser.id,
          role: ProjectRole.LEADER,
          status: MemberStatus.ACCEPTED,
        },
      },
      requiredSkills: {
        create: [
          {
            skillId: skillMap['Flutter'],
            minimumExperience: ExperienceLevel.INTERMEDIATE,
          },
          {
            skillId: skillMap['Python'],
            minimumExperience: ExperienceLevel.BEGINNER,
          },
          {
            skillId: skillMap['PostgreSQL'],
            minimumExperience: ExperienceLevel.BEGINNER,
          },
        ],
      },
    },
  });

  await prisma.project.upsert({
    where: { id: 'project-3' },
    update: {},
    create: {
      id: 'project-3',
      title: 'Smart Campus IoT Energy Monitor',
      description:
        'IoT sensor network to monitor and optimize classroom power consumption and AC usage in real-time.',
      domain: 'IoT & Hardware',
      semester: 'Spring 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 3,
      creatorId: creatorUser.id,
      members: {
        create: {
          userId: creatorUser.id,
          role: ProjectRole.LEADER,
          status: MemberStatus.ACCEPTED,
        },
      },
      requiredSkills: {
        create: [
          {
            skillId: skillMap['Python'],
            minimumExperience: ExperienceLevel.ADVANCED,
          },
          {
            skillId: skillMap['Docker'],
            minimumExperience: ExperienceLevel.INTERMEDIATE,
          },
        ],
      },
    },
  });

  // 5b. Seed Project 'proj-101' for Scheduler, Calendar & Tests
  await prisma.project.upsert({
    where: { id: 'proj-101' },
    update: {},
    create: {
      id: 'proj-101',
      title: 'AI Study Buddy & Collaboration Hub',
      description:
        'Team scheduling and calendar workspace for sprint milestones and meetings.',
      domain: 'Education & AI',
      semester: 'Fall 2026',
      status: ProjectStatus.OPEN,
      maxMembers: 4,
      creatorId: creatorUser.id,
      members: {
        create: {
          userId: creatorUser.id,
          role: ProjectRole.LEADER,
          status: MemberStatus.ACCEPTED,
        },
      },
    },
  });

  // Seed sample meetings for project-1 and proj-101
  for (const pid of ['project-1', 'proj-101']) {
    const existingMeeting = await prisma.meeting.findFirst({
      where: { projectId: pid },
    });
    if (!existingMeeting) {
      await prisma.meeting.create({
        data: {
          projectId: pid,
          title: 'Sprint Planning & Architecture Review',
          description: 'Review project architecture, tasks distribution, and deadlines.',
          status: 'VOTING',
          slots: {
            create: [
              {
                startTime: new Date(Date.now() + 86400000),
                endTime: new Date(Date.now() + 90000000),
              },
              {
                startTime: new Date(Date.now() + 172800000),
                endTime: new Date(Date.now() + 176400000),
              },
            ],
          },
        },
      });
    }
  }

  // 6. Ensure all users have LEADER role on project-1 and proj-101 for testing and candidate invitation
  const allUsers = await prisma.user.findMany();
  for (const u of allUsers) {
    for (const pid of ['project-1', 'proj-101', 'project-2', 'project-3']) {
      await prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: pid,
            userId: u.id,
          },
        },
        update: {
          role: ProjectRole.LEADER,
          status: MemberStatus.ACCEPTED,
        },
        create: {
          projectId: pid,
          userId: u.id,
          role: ProjectRole.LEADER,
          status: MemberStatus.ACCEPTED,
        },
      });
    }
  }

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
