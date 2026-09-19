import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from '../../components/Button';
import { Chip } from '../../components/Chip';
import { api, ApiError } from '../../api/client';
import * as Haptics from 'expo-haptics';

interface CreateProjectFormData {
  title: string;
  description: string;
  domain: string;
  semester: string;
  requiredSkills: string[];
  techStack: string[];
  maxMembers: string;
}

export const CreateProjectScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { colors, typography, spacing } = useTheme();

  const [formData, setFormData] = useState<CreateProjectFormData>({
    title: '',
    description: '',
    domain: '',
    semester: '',
    requiredSkills: [],
    techStack: [],
    maxMembers: '5',
  });

  const [skillInput, setSkillInput] = useState('');
  const [techInput, setTechInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Predefined options
  const domains = ['Mobile', 'Web', 'AI/ML', 'IoT', 'Blockchain', 'Game Dev', 'DevOps'];
  const semesters = ['Spring 2024', 'Summer 2024', 'Fall 2024', 'Spring 2025', 'Summer 2025', 'Fall 2025'];
  const suggestedSkills = ['React', 'Node.js', 'Python', 'TypeScript', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker'];
  const suggestedTech = ['React Native', 'NestJS', 'Express', 'Django', 'Flask', 'Next.js', 'Vue', 'Angular'];

  const updateField = (field: keyof CreateProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addSkill = (skill: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !formData.requiredSkills.includes(trimmedSkill)) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, trimmedSkill],
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skill),
    }));
  };

  const addTech = (tech: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    const trimmedTech = tech.trim();
    if (trimmedTech && !formData.techStack.includes(trimmedTech)) {
      setFormData(prev => ({
        ...prev,
        techStack: [...prev.techStack, trimmedTech],
      }));
      setTechInput('');
    }
  };

  const removeTech = (tech: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech),
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Project title is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Project description is required';
    }
    if (!formData.domain) {
      errors.domain = 'Please select a domain';
    }
    if (!formData.semester) {
      errors.semester = 'Please select a semester';
    }
    if (formData.requiredSkills.length === 0) {
      errors.requiredSkills = 'Add at least one required skill';
    }

    const maxMembers = parseInt(formData.maxMembers);
    if (isNaN(maxMembers) || maxMembers < 2 || maxMembers > 20) {
      errors.maxMembers = 'Max members must be between 2 and 20';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        domain: formData.domain,
        semester: formData.semester,
        requiredSkills: formData.requiredSkills,
        techStack: formData.techStack,
        maxMembers: parseInt(formData.maxMembers),
      };

      const createdProject = await api.post<{ id: string }>('/projects', payload);

      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }

      // Navigate to the newly created project
      navigation.replace('ProjectDetails', { projectId: createdProject.id });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to create project');
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingHorizontal: spacing.md }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.onSurface, ...typography.displayLarge }]}>
          Create New Project
        </Text>

        {/* Title */}
        <Text style={[styles.label, { color: colors.onSurface, ...typography.titleMedium }]}>
          Project Title *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
              borderColor: validationErrors.title ? colors.error : colors.outlineVariant,
            },
          ]}
          placeholder="e.g., Student Management System"
          placeholderTextColor={colors.onSurfaceVariant}
          value={formData.title}
          onChangeText={(text) => updateField('title', text)}
          editable={!loading}
        />
        {validationErrors.title && (
          <Text style={[styles.errorText, { color: colors.error }]}>{validationErrors.title}</Text>
        )}

        {/* Description */}
        <Text style={[styles.label, { color: colors.onSurface, ...typography.titleMedium }]}>
          Description *
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
              borderColor: validationErrors.description ? colors.error : colors.outlineVariant,
            },
          ]}
          placeholder="Describe your project, goals, and what you're looking for in teammates..."
          placeholderTextColor={colors.onSurfaceVariant}
          value={formData.description}
          onChangeText={(text) => updateField('description', text)}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          editable={!loading}
        />
        {validationErrors.description && (
          <Text style={[styles.errorText, { color: colors.error }]}>{validationErrors.description}</Text>
        )}

        {/* Domain */}
        <Text style={[styles.label, { color: colors.onSurface, ...typography.titleMedium }]}>
          Domain *
        </Text>
        <View style={styles.chipRow}>
          {domains.map(domain => (
            <Chip
              key={domain}
              label={domain}
              selected={formData.domain === domain}
              onPress={() => updateField('domain', formData.domain === domain ? '' : domain)}
              variant="primary"
            />
          ))}
        </View>
        {validationErrors.domain && (
          <Text style={[styles.errorText, { color: colors.error }]}>{validationErrors.domain}</Text>
        )}

        {/* Semester */}
        <Text style={[styles.label, { color: colors.onSurface, ...typography.titleMedium }]}>
          Semester *
        </Text>
        <View style={styles.chipRow}>
          {semesters.map(semester => (
            <Chip
              key={semester}
              label={semester}
              selected={formData.semester === semester}
              onPress={() => updateField('semester', formData.semester === semester ? '' : semester)}
              variant="secondary"
            />
          ))}
        </View>
        {validationErrors.semester && (
          <Text style={[styles.errorText, { color: colors.error }]}>{validationErrors.semester}</Text>
        )}

        {/* Required Skills */}
        <Text style={[styles.label, { color: colors.onSurface, ...typography.titleMedium }]}>
          Required Skills *
        </Text>
        <View style={styles.chipRow}>
          {formData.requiredSkills.map(skill => (
            <TouchableOpacity key={skill} onPress={() => removeSkill(skill)}>
              <Chip label={`${skill} ✕`} selected variant="tertiary" />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputWithButton}>
          <TextInput
            style={[
              styles.input,
              styles.flexInput,
              {
                backgroundColor: colors.surfaceVariant,
                color: colors.onSurface,
                borderColor: colors.outlineVariant,
              },
            ]}
            placeholder="Add a skill..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={skillInput}
            onChangeText={setSkillInput}
            onSubmitEditing={() => addSkill(skillInput)}
            returnKeyType="done"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primaryContainer }]}
            onPress={() => addSkill(skillInput)}
            disabled={loading}
          >
            <Text style={{ fontSize: 20 }}>➕</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.hintText, { color: colors.onSurfaceVariant }]}>Suggested:</Text>
        <View style={styles.chipRow}>
          {suggestedSkills.map(skill => (
            <Chip
              key={skill}
              label={skill}
              selected={false}
              onPress={() => addSkill(skill)}
              variant="primary"
            />
          ))}
        </View>
        {validationErrors.requiredSkills && (
          <Text style={[styles.errorText, { color: colors.error }]}>{validationErrors.requiredSkills}</Text>
        )}

        {/* Tech Stack (Optional) */}
        <Text style={[styles.label, { color: colors.onSurface, ...typography.titleMedium }]}>
          Tech Stack (Optional)
        </Text>
        <View style={styles.chipRow}>
          {formData.techStack.map(tech => (
            <TouchableOpacity key={tech} onPress={() => removeTech(tech)}>
              <Chip label={`${tech} ✕`} selected variant="secondary" />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputWithButton}>
          <TextInput
            style={[
              styles.input,
              styles.flexInput,
              {
                backgroundColor: colors.surfaceVariant,
                color: colors.onSurface,
                borderColor: colors.outlineVariant,
              },
            ]}
            placeholder="Add technology..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={techInput}
            onChangeText={setTechInput}
            onSubmitEditing={() => addTech(techInput)}
            returnKeyType="done"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.secondaryContainer }]}
            onPress={() => addTech(techInput)}
            disabled={loading}
          >
            <Text style={{ fontSize: 20 }}>➕</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.hintText, { color: colors.onSurfaceVariant }]}>Suggested:</Text>
        <View style={styles.chipRow}>
          {suggestedTech.map(tech => (
            <Chip
              key={tech}
              label={tech}
              selected={false}
              onPress={() => addTech(tech)}
              variant="secondary"
            />
          ))}
        </View>

        {/* Max Members */}
        <Text style={[styles.label, { color: colors.onSurface, ...typography.titleMedium }]}>
          Max Team Members *
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
              borderColor: validationErrors.maxMembers ? colors.error : colors.outlineVariant,
            },
          ]}
          placeholder="5"
          placeholderTextColor={colors.onSurfaceVariant}
          value={formData.maxMembers}
          onChangeText={(text) => updateField('maxMembers', text)}
          keyboardType="number-pad"
          editable={!loading}
        />
        {validationErrors.maxMembers && (
          <Text style={[styles.errorText, { color: colors.error }]}>{validationErrors.maxMembers}</Text>
        )}

        {/* Error Message */}
        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.errorContainer }]}>
            <Text style={[styles.errorBoxText, { color: colors.onErrorContainer }]}>
              ⚠️ {error}
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <Button
          title={loading ? 'Creating...' : 'Create Project'}
          onPress={handleSubmit}
          variant="filled"
          disabled={loading}
          style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={{ position: 'absolute', bottom: 50, alignSelf: 'center' }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingVertical: 24,
  },
  title: {
    fontWeight: '700',
    marginBottom: 24,
  },
  label: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  flexInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  errorBoxText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
