import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  Calendar,
  GitBranch,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Code2,
  Terminal,
  ShieldCheck,
  Layers,
  Sun,
  Moon,
  Clock,
  TrendingUp,
  Star,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Chip } from '../../components/Chip';

export interface LandingScreenProps {
  navigation: any;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  const { colors, typography, spacing, isDark, toggleTheme } = useTheme();
  const [activePreviewTab, setActivePreviewTab] = useState<'MATCH' | 'SCHEDULER' | 'GITHUB'>('MATCH');

  const handleNavigateRegister = () => {
    navigation.navigate('Register');
  };

  const handleNavigateLogin = () => {
    navigation.navigate('Login');
  };

  const isWeb = Platform.OS === 'web';

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#090D16' : '#F8FAFC',
        },
      ]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Background Ambient Glow Orbs */}
      <View style={styles.ambientGlowContainer} pointerEvents="none">
        <View
          style={[
            styles.glowOrbPrimary,
            {
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
            },
          ]}
        />
        <View
          style={[
            styles.glowOrbSecondary,
            {
              backgroundColor: isDark ? 'rgba(20, 184, 166, 0.12)' : 'rgba(20, 184, 166, 0.06)',
            },
          ]}
        />
      </View>

      {/* Floating Glassmorphic Top Navbar */}
      <View
        style={[
          styles.navbar,
          {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <View style={styles.brandRow}>
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <Layers size={18} color="#FFFFFF" />
          </LinearGradient>
          <View style={{ marginLeft: 10 }}>
            <Text
              style={[
                styles.brandTitle,
                { color: isDark ? '#FFFFFF' : '#0F172A' },
              ]}
            >
              TeamUp
            </Text>
            <Text style={[styles.brandSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              Campus Dev Hub
            </Text>
          </View>
        </View>

        <View style={styles.navActions}>
          <TouchableOpacity
            style={[
              styles.themeToggleBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
            onPress={toggleTheme}
            accessibilityLabel="Toggle theme"
          >
            {isDark ? (
              <Sun size={15} color="#FBBF24" />
            ) : (
              <Moon size={15} color="#6366F1" />
            )}
            <Text
              style={[
                styles.themeToggleText,
                { color: isDark ? '#F1F5F9' : '#1E293B', marginLeft: 6 },
              ]}
            >
              {isDark ? 'Light' : 'Dark'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNavigateLogin}
            style={[
              styles.navLoginBtn,
              {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
              },
            ]}
          >
            <Text
              style={[
                styles.navLoginText,
                { color: isDark ? '#F1F5F9' : '#0F172A' },
              ]}
            >
              Log In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNavigateRegister}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#6366F1', '#4338CA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.navJoinGradient}
            >
              <Text style={styles.navJoinText}>Join TeamUp</Text>
              <ArrowRight size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        {/* Glowing Live Beta Pill */}
        <View
          style={[
            styles.heroPillContainer,
            {
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
              borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
            },
          ]}
        >
          <View style={styles.livePulseDot} />
          <Text
            style={[
              styles.heroPillText,
              { color: isDark ? '#A5B4FC' : '#4F46E5' },
            ]}
          >
            Built for University Creators & Hackathons
          </Text>
        </View>

        {/* Main Headline */}
        <Text
          style={[
            styles.heroHeadline,
            { color: isDark ? '#FFFFFF' : '#0F172A' },
          ]}
        >
          Your next project starts with{' '}
          <Text style={styles.gradientHeadlineHighlight}>the right team.</Text>
        </Text>

        {/* Hero Subtitle */}
        <Text
          style={[
            styles.heroSubtitle,
            { color: isDark ? '#94A3B8' : '#475569' },
          ]}
        >
          Connect with classmates who complement your stack, match your schedule, and actually want to build great software together.
        </Text>

        {/* Hero CTAs */}
        <View style={styles.heroCtaRow}>
          <TouchableOpacity
            onPress={handleNavigateRegister}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroPrimaryBtn}
            >
              <Text style={styles.heroPrimaryBtnText}>Join TeamUp</Text>
              <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNavigateLogin}
            style={[
              styles.heroSecondaryBtn,
              {
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
              },
            ]}
          >
            <Text
              style={[
                styles.heroSecondaryBtnText,
                { color: isDark ? '#F1F5F9' : '#1E293B' },
              ]}
            >
              Log In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feature Highlight Tags */}
        <View style={styles.highlightRow}>
          <View
            style={[
              styles.highlightTag,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <Code2 size={13} color="#6366F1" style={{ marginRight: 6 }} />
            <Text style={[styles.highlightTagText, { color: isDark ? '#E2E8F0' : '#334155' }]}>
              Stack Compatibility
            </Text>
          </View>

          <View
            style={[
              styles.highlightTag,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <GitBranch size={13} color="#14B8A6" style={{ marginRight: 6 }} />
            <Text style={[styles.highlightTagText, { color: isDark ? '#E2E8F0' : '#334155' }]}>
              GitHub Activity Sync
            </Text>
          </View>

          <View
            style={[
              styles.highlightTag,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <Calendar size={13} color="#F43F5E" style={{ marginRight: 6 }} />
            <Text style={[styles.highlightTagText, { color: isDark ? '#E2E8F0' : '#334155' }]}>
              Conflict-Free Scheduling
            </Text>
          </View>

          <View
            style={[
              styles.highlightTag,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <Zap size={13} color="#EAB308" style={{ marginRight: 6 }} />
            <Text style={[styles.highlightTagText, { color: isDark ? '#E2E8F0' : '#334155' }]}>
              Capstone & Hackathons
            </Text>
          </View>
        </View>
      </View>

      {/* High-Impact Statistics Banner */}
      <View
        style={[
          styles.statsBanner,
          {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View style={styles.statCol}>
          <Text style={[styles.statValue, { color: '#6366F1' }]}>3.4x</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Faster Team Assembly
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
        <View style={styles.statCol}>
          <Text style={[styles.statValue, { color: '#14B8A6' }]}>95%+</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Match Compatibility
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
        <View style={styles.statCol}>
          <Text style={[styles.statValue, { color: '#F43F5E' }]}>100%</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Verified GitHub Data
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
        <View style={styles.statCol}>
          <Text style={[styles.statValue, { color: '#EAB308' }]}>Zero</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Schedule Clashes
          </Text>
        </View>
      </View>

      {/* Mac-Style Live Interactive Product Window */}
      <View style={styles.windowSection}>
        <View
          style={[
            styles.macWindow,
            {
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
        >
          {/* Mac Window Header Bar */}
          <View
            style={[
              styles.macWindowHeader,
              {
                borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <View style={styles.macDotsRow}>
              <View style={[styles.macDot, { backgroundColor: '#EF4444' }]} />
              <View style={[styles.macDot, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.macDot, { backgroundColor: '#10B981' }]} />
            </View>

            {/* Address Pill */}
            <View
              style={[
                styles.macAddressPill,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              <Text
                style={[
                  styles.macAddressText,
                  { color: isDark ? '#64748B' : '#94A3B8' },
                ]}
              >
                teamup.edu/match?stack=React+Native,TypeScript
              </Text>
            </View>

            {/* Preview Window Tabs */}
            <View style={styles.macTabsRow}>
              <TouchableOpacity
                onPress={() => setActivePreviewTab('MATCH')}
                style={[
                  styles.macTab,
                  activePreviewTab === 'MATCH' && {
                    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                    borderColor: '#6366F1',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.macTabText,
                    {
                      color:
                        activePreviewTab === 'MATCH'
                          ? '#6366F1'
                          : isDark
                          ? '#94A3B8'
                          : '#64748B',
                    },
                  ]}
                >
                  Candidate Match
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActivePreviewTab('SCHEDULER')}
                style={[
                  styles.macTab,
                  activePreviewTab === 'SCHEDULER' && {
                    backgroundColor: isDark ? 'rgba(20, 184, 166, 0.2)' : 'rgba(20, 184, 166, 0.1)',
                    borderColor: '#14B8A6',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.macTabText,
                    {
                      color:
                        activePreviewTab === 'SCHEDULER'
                          ? '#14B8A6'
                          : isDark
                          ? '#94A3B8'
                          : '#64748B',
                    },
                  ]}
                >
                  Slot Voting
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mac Window Content Body */}
          <View style={styles.macWindowBody}>
            {activePreviewTab === 'MATCH' ? (
              <View style={styles.previewSplitView}>
                {/* Left: Candidate Profile Card */}
                <View
                  style={[
                    styles.previewCandidateCol,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <View style={styles.candidateHeaderRow}>
                    <View style={styles.candidateAvatarWrap}>
                      <LinearGradient
                        colors={['#6366F1', '#A855F7']}
                        style={styles.candidateAvatarGradient}
                      >
                        <Text style={styles.candidateAvatarInitials}>AJ</Text>
                      </LinearGradient>
                      <View style={styles.onlineStatusBadge} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={styles.candidateNameRow}>
                        <Text
                          style={[
                            styles.candidateNameText,
                            { color: isDark ? '#FFFFFF' : '#0F172A' },
                          ]}
                        >
                          Alice Johnson
                        </Text>
                        <View style={styles.verifiedBadge}>
                          <ShieldCheck size={14} color="#10B981" />
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.candidateMetaText,
                          { color: isDark ? '#94A3B8' : '#64748B' },
                        ]}
                      >
                        Computer Science • Senior • Available 15h/week
                      </Text>
                    </View>

                    {/* Match Score Gauge */}
                    <View style={styles.matchScoreBadgeWrap}>
                      <Text style={styles.matchScoreNumber}>95%</Text>
                      <Text style={styles.matchScoreLabel}>Match</Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.candidateBioText,
                      { color: isDark ? '#CBD5E1' : '#334155' },
                    ]}
                  >
                    Fullstack React Native and Node developer. Passionate about building clean mobile architectures, offline-first sync, and developer tooling.
                  </Text>

                  {/* Skills Grid */}
                  <View style={styles.candidateSkillsRow}>
                    <View style={styles.skillItemPillPrimary}>
                      <Text style={styles.skillItemTextPrimary}>#React Native</Text>
                      <View style={styles.skillLevelDot} />
                    </View>
                    <View style={styles.skillItemPillPrimary}>
                      <Text style={styles.skillItemTextPrimary}>#TypeScript</Text>
                      <View style={styles.skillLevelDot} />
                    </View>
                    <View style={styles.skillItemPillSecondary}>
                      <Text style={styles.skillItemTextSecondary}>#Node.js</Text>
                    </View>
                    <View style={styles.skillItemPillSecondary}>
                      <Text style={styles.skillItemTextSecondary}>#PostgreSQL</Text>
                    </View>
                  </View>

                  {/* GitHub Activity Strip */}
                  <View
                    style={[
                      styles.githubActivityStrip,
                      {
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <View style={styles.githubStatsMeta}>
                      <GitBranch size={14} color="#6366F1" />
                      <Text
                        style={[
                          styles.githubUsernameText,
                          { color: isDark ? '#E2E8F0' : '#1E293B' },
                        ]}
                      >
                        @alicejohnson
                      </Text>
                      <Text style={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 12 }}>
                        • 24 repos • 350 commits this year
                      </Text>
                    </View>

                    {/* Commit Activity Heat Dots */}
                    <View style={styles.heatDotsGrid}>
                      {[
                        '#10B981', '#10B981', '#34D399', '#10B981',
                        '#059669', '#34D399', '#10B981', '#059669',
                        '#10B981', '#34D399', '#059669', '#10B981',
                      ].map((c, i) => (
                        <View
                          key={i}
                          style={[styles.heatDot, { backgroundColor: c }]}
                        />
                      ))}
                    </View>
                  </View>

                  {/* Invite CTA Button */}
                  <View style={{ marginTop: 16 }}>
                    <TouchableOpacity
                      onPress={handleNavigateRegister}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#6366F1', '#4F46E5']}
                        style={styles.candidateInviteBtn}
                      >
                        <Text style={styles.candidateInviteBtnText}>Invite to Team</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Right: Compatibility Breakdown */}
                <View
                  style={[
                    styles.previewBreakdownCol,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.breakdownHeading,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    Scoring Breakdown
                  </Text>
                  <Text
                    style={[
                      styles.breakdownSubhead,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    How the recommendation engine ranks candidates
                  </Text>

                  {/* Meter 1: Skill Overlap */}
                  <View style={styles.meterItem}>
                    <View style={styles.meterLabelRow}>
                      <Text style={[styles.meterLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                        Skill Overlap (40% weight)
                      </Text>
                      <Text style={[styles.meterPct, { color: '#6366F1' }]}>98%</Text>
                    </View>
                    <View
                      style={[
                        styles.meterTrack,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                      ]}
                    >
                      <View style={[styles.meterFill, { width: '98%', backgroundColor: '#6366F1' }]} />
                    </View>
                  </View>

                  {/* Meter 2: Experience Match */}
                  <View style={styles.meterItem}>
                    <View style={styles.meterLabelRow}>
                      <Text style={[styles.meterLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                        Experience Level (30% weight)
                      </Text>
                      <Text style={[styles.meterPct, { color: '#14B8A6' }]}>92%</Text>
                    </View>
                    <View
                      style={[
                        styles.meterTrack,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                      ]}
                    >
                      <View style={[styles.meterFill, { width: '92%', backgroundColor: '#14B8A6' }]} />
                    </View>
                  </View>

                  {/* Meter 3: GitHub Activity */}
                  <View style={styles.meterItem}>
                    <View style={styles.meterLabelRow}>
                      <Text style={[styles.meterLabel, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                        GitHub Code Activity (30% weight)
                      </Text>
                      <Text style={[styles.meterPct, { color: '#F43F5E' }]}>95%</Text>
                    </View>
                    <View
                      style={[
                        styles.meterTrack,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                      ]}
                    >
                      <View style={[styles.meterFill, { width: '95%', backgroundColor: '#F43F5E' }]} />
                    </View>
                  </View>

                  {/* Verified Quality Guarantee */}
                  <View
                    style={[
                      styles.verifiedBanner,
                      {
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                        borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                      },
                    ]}
                  >
                    <CheckCircle2 size={16} color="#10B981" />
                    <Text
                      style={[
                        styles.verifiedBannerText,
                        { color: isDark ? '#A7F3D0' : '#065F46' },
                      ]}
                    >
                      Zero deadweight: Candidates have active repo activity within the last 30 days.
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              /* Scheduler Slot Voting Mockup */
              <View style={styles.schedulerMockWrap}>
                <View style={styles.schedulerMockHeader}>
                  <Calendar size={18} color="#14B8A6" />
                  <Text
                    style={[
                      styles.schedulerMockTitle,
                      { color: isDark ? '#FFFFFF' : '#0F172A', marginLeft: 8 },
                    ]}
                  >
                    Sprint 1 Architecture & Task Review
                  </Text>
                  <View style={styles.votingActivePill}>
                    <Text style={styles.votingActiveText}>Voting Active</Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.schedulerMockDesc,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  Cast your vote for the best team sync time slot. Confirms automatically when consensus is reached.
                </Text>

                {/* Slot 1 */}
                <View
                  style={[
                    styles.slotMockCard,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: '#14B8A6',
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.slotTimeText,
                        { color: isDark ? '#FFFFFF' : '#0F172A' },
                      ]}
                    >
                      Tuesday, 3:00 PM - 4:00 PM
                    </Text>
                    <Text style={{ color: '#14B8A6', fontSize: 13, marginTop: 2, fontWeight: '600' }}>
                      4 of 4 team members available (100% consensus)
                    </Text>
                  </View>
                  <View style={styles.slotConfirmedBadge}>
                    <Text style={styles.slotConfirmedText}>Winning Slot</Text>
                  </View>
                </View>

                {/* Slot 2 */}
                <View
                  style={[
                    styles.slotMockCard,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.slotTimeText,
                        { color: isDark ? '#FFFFFF' : '#0F172A' },
                      ]}
                    >
                      Thursday, 11:00 AM - 12:00 PM
                    </Text>
                    <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 13, marginTop: 2 }}>
                      2 of 4 team members available
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Bento Grid Features Section */}
      <View style={styles.bentoSection}>
        <Text style={styles.sectionEyebrow}>ARCHITECTURE & WORKFLOW</Text>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? '#FFFFFF' : '#0F172A' },
          ]}
        >
          Built to make project collaboration effortless
        </Text>
        <Text
          style={[
            styles.sectionSubtitle,
            { color: isDark ? '#94A3B8' : '#64748B' },
          ]}
        >
          Everything from finding compatible developers to running team syncs, designed for campus teams.
        </Text>

        <View style={styles.bentoGrid}>
          {/* Bento Card 1: Skill Matching */}
          <View
            style={[
              styles.bentoCard,
              {
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              style={styles.bentoIconBadge}
            >
              <Users size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text
              style={[
                styles.bentoCardTitle,
                { color: isDark ? '#FFFFFF' : '#0F172A' },
              ]}
            >
              Skill-Based Matching
            </Text>
            <Text
              style={[
                styles.bentoCardBody,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              Search by specific technologies like React Native, Python, or TypeScript. Find classmates whose verified skill set matches your exact project requirements.
            </Text>

            <View style={styles.bentoPillsWrap}>
              <Text style={styles.bentoMiniPill}>#React Native</Text>
              <Text style={styles.bentoMiniPill}>#TypeScript</Text>
              <Text style={styles.bentoMiniPill}>#Node.js</Text>
            </View>
          </View>

          {/* Bento Card 2: Smart Scheduler */}
          <View
            style={[
              styles.bentoCard,
              {
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <LinearGradient
              colors={['#14B8A6', '#0D9488']}
              style={styles.bentoIconBadge}
            >
              <Calendar size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text
              style={[
                styles.bentoCardTitle,
                { color: isDark ? '#FFFFFF' : '#0F172A' },
              ]}
            >
              Smart Meeting Scheduler
            </Text>
            <Text
              style={[
                styles.bentoCardBody,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              Propose candidate meeting slots and let your team vote. Once consensus is reached, lock the winning slot into the shared project calendar instantly.
            </Text>

            <View style={styles.bentoPillsWrap}>
              <Text style={styles.bentoMiniPillTeal}>Candidate Slots</Text>
              <Text style={styles.bentoMiniPillTeal}>Consensus Lock</Text>
            </View>
          </View>

          {/* Bento Card 3: GitHub Activity Sync */}
          <View
            style={[
              styles.bentoCard,
              {
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <LinearGradient
              colors={['#F43F5E', '#E11D48']}
              style={styles.bentoIconBadge}
            >
              <GitBranch size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text
              style={[
                styles.bentoCardTitle,
                { color: isDark ? '#FFFFFF' : '#0F172A' },
              ]}
            >
              Verified GitHub Activity
            </Text>
            <Text
              style={[
                styles.bentoCardBody,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              Connect your GitHub account via OAuth. Display real commit frequency, public repositories, and top languages so teammates know your coding track record.
            </Text>

            <View style={styles.bentoPillsWrap}>
              <Text style={styles.bentoMiniPillCoral}>OAuth 2.0</Text>
              <Text style={styles.bentoMiniPillCoral}>Verified Repos</Text>
            </View>
          </View>

          {/* Bento Card 4: Idea Hub */}
          <View
            style={[
              styles.bentoCard,
              {
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <LinearGradient
              colors={['#EAB308', '#CA8A04']}
              style={styles.bentoIconBadge}
            >
              <Sparkles size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text
              style={[
                styles.bentoCardTitle,
                { color: isDark ? '#FFFFFF' : '#0F172A' },
              ]}
            >
              Collaborative Idea Hub
            </Text>
            <Text
              style={[
                styles.bentoCardBody,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              Explore capstone ideas, upvote community submissions, and generate structured project proposals powered by AI to kickstart your next build.
            </Text>

            <View style={styles.bentoPillsWrap}>
              <Text style={styles.bentoMiniPillYellow}>AI Blueprints</Text>
              <Text style={styles.bentoMiniPillYellow}>Upvote Feed</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3-Step Workflow */}
      <View style={styles.workflowSection}>
        <Text style={styles.sectionEyebrow}>HOW IT WORKS</Text>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? '#FFFFFF' : '#0F172A' },
          ]}
        >
          Three steps to your dream team
        </Text>

        <View style={styles.stepsGrid}>
          {/* Step 1 */}
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.stepNumCirclePrimary}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <Text
              style={[
                styles.stepCardTitle,
                { color: isDark ? '#FFFFFF' : '#0F172A' },
              ]}
            >
              Create Your Profile
            </Text>
            <Text
              style={[
                styles.stepCardBody,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              List your department, semester, and skills. Connect your GitHub account with a single click.
            </Text>
          </View>

          {/* Step 2 */}
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.stepNumCircleSecondary}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <Text
              style={[
                styles.stepCardTitle,
                { color: isDark ? '#FFFFFF' : '#0F172A' },
              ]}
            >
              Match & Invite
            </Text>
            <Text
              style={[
                styles.stepCardBody,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              Search by skill name, review compatibility percentages, and send invitations directly to candidates.
            </Text>
          </View>

          {/* Step 3 */}
          <View
            style={[
              styles.stepCard,
              {
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.stepNumCircleTertiary}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <Text
              style={[
                styles.stepCardTitle,
                { color: isDark ? '#FFFFFF' : '#0F172A' },
              ]}
            >
              Schedule & Ship
            </Text>
            <Text
              style={[
                styles.stepCardBody,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
            >
              Propose meeting times, track project deadlines on the team calendar, and deliver your project together.
            </Text>
          </View>
        </View>
      </View>

      {/* Student Testimonials */}
      <View style={styles.testimonialSection}>
        <Text style={styles.sectionEyebrow}>STUDENT VOICES</Text>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? '#FFFFFF' : '#0F172A' },
          ]}
        >
          Built by students, trusted by developers
        </Text>

        <View style={styles.testimonialGrid}>
          <View
            style={[
              styles.testimonialCard,
              {
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 3 }} />
              ))}
            </View>
            <Text
              style={[
                styles.testimonialQuoteText,
                { color: isDark ? '#CBD5E1' : '#334155' },
              ]}
            >
              "TeamUp helped us assemble our capstone team in two days. The GitHub stats and skill matching made it obvious who had real experience."
            </Text>
            <View style={styles.testimonialAuthorRow}>
              <View style={[styles.authorAvatar, { backgroundColor: '#6366F1' }]}>
                <Text style={styles.authorAvatarText}>CS</Text>
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text
                  style={[
                    styles.authorNameText,
                    { color: isDark ? '#FFFFFF' : '#0F172A' },
                  ]}
                >
                  Computer Science Senior
                </Text>
                <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}>
                  AI Study Buddy Lead
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.testimonialCard,
              {
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 3 }} />
              ))}
            </View>
            <Text
              style={[
                styles.testimonialQuoteText,
                { color: isDark ? '#CBD5E1' : '#334155' },
              ]}
            >
              "Scheduling syncs used to take 20 messages back and forth. With TeamUp slot voting, we confirm meeting times in minutes."
            </Text>
            <View style={styles.testimonialAuthorRow}>
              <View style={[styles.authorAvatar, { backgroundColor: '#14B8A6' }]}>
                <Text style={styles.authorAvatarText}>SE</Text>
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text
                  style={[
                    styles.authorNameText,
                    { color: isDark ? '#FFFFFF' : '#0F172A' },
                  ]}
                >
                  Software Engineering Junior
                </Text>
                <Text style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}>
                  Hackathon Finalist Team
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* High-Conversion Bottom CTA Banner */}
      <View style={styles.bottomCtaSection}>
        <LinearGradient
          colors={isDark ? ['#1E1B4B', '#0F172A'] : ['#EEF2FF', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.bottomCtaCard,
            {
              borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
            },
          ]}
        >
          <Text
            style={[
              styles.bottomCtaTitle,
              { color: isDark ? '#FFFFFF' : '#0F172A' },
            ]}
          >
            Ready to build your next project?
          </Text>
          <Text
            style={[
              styles.bottomCtaSubtitle,
              { color: isDark ? '#94A3B8' : '#475569' },
            ]}
          >
            Create your profile in 60 seconds and connect with teammates across campus today.
          </Text>

          <View style={styles.bottomCtaBtnsRow}>
            <TouchableOpacity
              onPress={handleNavigateRegister}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bottomJoinBtn}
              >
                <Text style={styles.bottomJoinBtnText}>Join TeamUp</Text>
                <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNavigateLogin}
              style={[
                styles.bottomLoginBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                },
              ]}
            >
              <Text
                style={[
                  styles.bottomLoginBtnText,
                  { color: isDark ? '#F1F5F9' : '#1E293B' },
                ]}
              >
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <Text
          style={[
            styles.footerText,
            { color: isDark ? '#64748B' : '#94A3B8' },
          ]}
        >
          TeamUp &bull; University Collaboration & Project Matching Platform
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  ambientGlowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 700,
    overflow: 'hidden',
  },
  glowOrbPrimary: {
    position: 'absolute',
    top: -150,
    left: '20%',
    width: 500,
    height: 500,
    borderRadius: 250,
  },
  glowOrbSecondary: {
    position: 'absolute',
    top: 50,
    right: '10%',
    width: 450,
    height: 450,
    borderRadius: 225,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    marginTop: 14,
    borderWidth: 1,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  navLoginBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  navLoginText: {
    fontSize: 13,
    fontWeight: '600',
  },
  navJoinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  navJoinText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    maxWidth: 860,
    width: '100%',
    alignSelf: 'center',
  },
  heroPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  heroHeadline: {
    fontWeight: '900',
    fontSize: 44,
    lineHeight: 52,
    textAlign: 'center',
    letterSpacing: -1,
  },
  gradientHeadlineHighlight: {
    color: '#6366F1',
  },
  heroSubtitle: {
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 680,
  },
  heroCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 28,
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 160,
    justifyContent: 'center',
  },
  heroPrimaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  heroSecondaryBtn: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSecondaryBtnText: {
    fontWeight: '600',
    fontSize: 15,
  },
  highlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
  },
  highlightTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  highlightTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
    marginTop: 36,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  windowSection: {
    maxWidth: 1050,
    width: '100%',
    alignSelf: 'center',
    marginTop: 48,
  },
  macWindow: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  macWindowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  macDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  macDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  macAddressPill: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 8,
  },
  macAddressText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  macTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  macTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  macWindowBody: {
    padding: 20,
  },
  previewSplitView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  previewCandidateCol: {
    flex: 1.3,
    minWidth: 320,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  candidateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  candidateAvatarWrap: {
    position: 'relative',
  },
  candidateAvatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  candidateAvatarInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  onlineStatusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  candidateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  candidateNameText: {
    fontWeight: '800',
    fontSize: 17,
  },
  verifiedBadge: {
    justifyContent: 'center',
  },
  candidateMetaText: {
    fontSize: 12,
    marginTop: 2,
  },
  matchScoreBadgeWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  matchScoreNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#6366F1',
  },
  matchScoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'uppercase',
  },
  candidateBioText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
  },
  candidateSkillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  skillItemPillPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  skillItemTextPrimary: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 12,
  },
  skillLevelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
    marginLeft: 6,
  },
  skillItemPillSecondary: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  skillItemTextSecondary: {
    color: '#14B8A6',
    fontWeight: '700',
    fontSize: 12,
  },
  githubActivityStrip: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  githubStatsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  githubUsernameText: {
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  heatDotsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  heatDot: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  candidateInviteBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  candidateInviteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  previewBreakdownCol: {
    flex: 1,
    minWidth: 280,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  breakdownHeading: {
    fontWeight: '800',
    fontSize: 16,
  },
  breakdownSubhead: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  meterItem: {
    marginBottom: 14,
  },
  meterLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  meterPct: {
    fontSize: 12,
    fontWeight: '800',
  },
  meterTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 16,
  },
  verifiedBannerText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  schedulerMockWrap: {
    padding: 10,
  },
  schedulerMockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schedulerMockTitle: {
    fontWeight: '800',
    fontSize: 16,
    flex: 1,
  },
  votingActivePill: {
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  votingActiveText: {
    color: '#14B8A6',
    fontWeight: '700',
    fontSize: 11,
  },
  schedulerMockDesc: {
    fontSize: 13,
    marginTop: 6,
    marginBottom: 16,
  },
  slotMockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  slotTimeText: {
    fontWeight: '700',
    fontSize: 15,
  },
  slotConfirmedBadge: {
    backgroundColor: '#14B8A6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  slotConfirmedText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  bentoSection: {
    maxWidth: 1050,
    width: '100%',
    alignSelf: 'center',
    marginTop: 60,
  },
  sectionEyebrow: {
    color: '#6366F1',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontWeight: '900',
    fontSize: 32,
    lineHeight: 40,
    marginTop: 6,
    letterSpacing: -0.6,
  },
  sectionSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: 6,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 24,
  },
  bentoCard: {
    flex: 1,
    minWidth: 280,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  bentoIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bentoCardTitle: {
    fontWeight: '800',
    fontSize: 18,
  },
  bentoCardBody: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  bentoPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 16,
  },
  bentoMiniPill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bentoMiniPillTeal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14B8A6',
    backgroundColor: 'rgba(20, 184, 166, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bentoMiniPillCoral: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F43F5E',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bentoMiniPillYellow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CA8A04',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  workflowSection: {
    maxWidth: 1050,
    width: '100%',
    alignSelf: 'center',
    marginTop: 60,
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 24,
  },
  stepCard: {
    flex: 1,
    minWidth: 260,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  stepNumCirclePrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepNumCircleSecondary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepNumCircleTertiary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F43F5E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepNumText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  stepCardTitle: {
    fontWeight: '800',
    fontSize: 17,
  },
  stepCardBody: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  testimonialSection: {
    maxWidth: 1050,
    width: '100%',
    alignSelf: 'center',
    marginTop: 60,
  },
  testimonialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 24,
  },
  testimonialCard: {
    flex: 1,
    minWidth: 320,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  testimonialQuoteText: {
    fontSize: 14,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  testimonialAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  authorNameText: {
    fontWeight: '700',
    fontSize: 14,
  },
  bottomCtaSection: {
    maxWidth: 1050,
    width: '100%',
    alignSelf: 'center',
    marginTop: 60,
  },
  bottomCtaCard: {
    padding: 40,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
  },
  bottomCtaTitle: {
    fontWeight: '900',
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  bottomCtaSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 520,
  },
  bottomCtaBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
  },
  bottomJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bottomJoinBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  bottomLoginBtn: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  bottomLoginBtnText: {
    fontWeight: '700',
    fontSize: 15,
  },
  footer: {
    borderTopWidth: 1,
    alignItems: 'center',
    paddingTop: 30,
    marginTop: 40,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
