/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LandingScreen } from '../screens/Landing/LandingScreen';
import { ThemeProvider } from '../theme/ThemeContext';
import { projectService, Project } from '../services/projectService';

jest.mock('../services/projectService', () => ({
  projectService: {
    getProjects: jest.fn(),
  },
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return new Proxy({}, {
    get: (_, name) => (props: any) =>
      React.createElement(View, { testID: `icon-${String(name)}`, ...props }),
  });
});

describe('Landing Screen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  const sampleProjects: Project[] = [
    {
      id: 'proj-1',
      title: 'Autonomous Drone Fleet',
      description: 'Developing multi-agent drone coordination protocols using ROS2 and Python.',
      domain: 'Robotics',
      semester: 'Fall 2026',
      maxMembers: 4,
      status: 'OPEN',
      creatorId: 'user-1',
      creator: {
        id: 'user-1',
        email: 'alex@university.edu',
        profile: {
          fullName: 'Alex Vance',
        },
      },
      requiredSkills: [
        { skill: { id: 's1', name: 'ROS2' } },
        { skill: { id: 's2', name: 'Python' } },
      ],
      members: [
        { id: 'm1', userId: 'user-1', role: 'LEADER', status: 'ACCEPTED' },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (projectService.getProjects as jest.Mock).mockResolvedValue(sampleProjects);
  });

  it('renders hero headline, subtitle, and feature tags', async () => {
    const { getByText, getAllByText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    // Hero headline and subtitle
    expect(getByText('Your next project starts with the right team.')).toBeTruthy();
    expect(
      getByText(
        'Connect with classmates who complement your stack, match your schedule, and actually want to build great software together.'
      )
    ).toBeTruthy();

    // Feature tags
    expect(getByText('Stack Compatibility')).toBeTruthy();
    expect(getByText('GitHub Activity Sync')).toBeTruthy();
    expect(getByText('Conflict-Free Scheduling')).toBeTruthy();
    expect(getByText('Capstone & Hackathons')).toBeTruthy();

    // Primary action CTAs
    expect(getAllByText('Join TeamUp').length).toBeGreaterThan(0);
    expect(getAllByText('Log In').length).toBeGreaterThan(0);
    expect(getAllByText('Explore Marketplace').length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(projectService.getProjects).toHaveBeenCalled();
    });
  });

  it('navigates to Register when Join TeamUp is pressed', async () => {
    const { getAllByText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    const joinButtons = getAllByText('Join TeamUp');
    fireEvent.press(joinButtons[0]);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');

    await waitFor(() => {
      expect(projectService.getProjects).toHaveBeenCalled();
    });
  });

  it('navigates to Login when Log In is pressed', async () => {
    const { getAllByText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    const loginButtons = getAllByText('Log In');
    fireEvent.press(loginButtons[0]);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');

    await waitFor(() => {
      expect(projectService.getProjects).toHaveBeenCalled();
    });
  });

  it('navigates to Marketplace when Explore Marketplace is pressed', async () => {
    const { getAllByText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    const marketplaceButtons = getAllByText('Explore Marketplace');
    fireEvent.press(marketplaceButtons[0]);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Marketplace');

    await waitFor(() => {
      expect(projectService.getProjects).toHaveBeenCalled();
    });
  });

  it('renders bento feature cards and 3-step workflow', async () => {
    const { getByText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    // Bento cards
    expect(getByText('Skill-Based Matching')).toBeTruthy();
    expect(getByText('Smart Meeting Scheduler')).toBeTruthy();
    expect(getByText('Verified GitHub Activity')).toBeTruthy();
    expect(getByText('Collaborative Workspace')).toBeTruthy();

    // 3 steps
    expect(getByText('Create Your Profile')).toBeTruthy();
    expect(getByText('Match & Invite')).toBeTruthy();
    expect(getByText('Schedule & Ship')).toBeTruthy();

    await waitFor(() => {
      expect(projectService.getProjects).toHaveBeenCalled();
    });
  });

  it('renders live active projects from backend and navigates to ProjectDetail on card click', async () => {
    const { getByText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    expect(projectService.getProjects).toHaveBeenCalledWith({ limit: 4 });

    await waitFor(() => {
      expect(getByText('Autonomous Drone Fleet')).toBeTruthy();
    });

    expect(getByText('Robotics')).toBeTruthy();
    expect(getByText('Fall 2026')).toBeTruthy();
    expect(getByText('ROS2')).toBeTruthy();
    expect(getByText('Python')).toBeTruthy();
    expect(getByText('Alex Vance')).toBeTruthy();

    fireEvent.press(getByText('Autonomous Drone Fleet'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ProjectDetail', {
      projectId: 'proj-1',
    });
  });

  it('renders fallback empty state when no projects are returned', async () => {
    (projectService.getProjects as jest.Mock).mockResolvedValueOnce([]);

    const { getByText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('No active projects yet')).toBeTruthy();
    });

    expect(
      getByText('Be the first to propose a project and assemble your team on campus.')
    ).toBeTruthy();
  });

  it('allows toggling dark/light theme via theme toggle button', async () => {
    const { getByLabelText } = render(
      <ThemeProvider>
        <LandingScreen navigation={mockNavigation} />
      </ThemeProvider>
    );

    const toggleBtn = getByLabelText('Toggle theme');
    expect(toggleBtn).toBeTruthy();
    fireEvent.press(toggleBtn);

    await waitFor(() => {
      expect(projectService.getProjects).toHaveBeenCalled();
    });
  });
});
