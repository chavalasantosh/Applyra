import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveVaultSuggestions } from '../assets/workspaces/vault-suggestions.mjs';

test('vault suggestions never infer work authorization, relocation, per-skill years, capability confirmations, or arbitrary portfolio URLs', () => {
  const items = deriveVaultSuggestions({
    profile: {
      currentLocation: 'Bengaluru, India',
      locations: ['Bengaluru', 'Hyderabad', 'Pune'],
      yearsExperience: 5,
      skills: ['Python', 'LangGraph', 'Docker'],
      naukriProfile: {
        identity: { currentLocation: 'Bengaluru, India', experienceYears: 5, noticePeriod: 'Immediate' },
        itSkills: [
          { skillText: 'Python', experienceYears: 3 },
          { skillText: 'Docker', experienceYears: 0 }
        ],
        accomplishments: {
          onlineProfiles: [
            { title: 'Personal Site', link: 'https://random-blog.example.com' }
          ]
        }
      }
    },
    careerEvidence: {
      'local-profile': {
        resume: { text: 'Built apps\nhttps://example.org/unrelated\nhttps://github.com/janedoe\nhttps://www.linkedin.com/in/janedoe' }
      }
    }
  });

  const byKey = Object.fromEntries(items.map((x) => [x.key, x]));
  assert.equal(byKey.workAuthorization, undefined);
  assert.equal(byKey.relocation, undefined);
  assert.equal(byKey.capabilityFacts, undefined);
  assert.equal(byKey.portfolioUrl, undefined);
  assert.equal(byKey.experienceFacts.value, 'Python = 3');
  assert.equal(byKey.githubUrl.value, 'https://github.com/janedoe');
  assert.equal(byKey.linkedinUrl.value, 'https://www.linkedin.com/in/janedoe');
});

test('vault suggestions enforce strict candidate isolation without local-profile fallback', () => {
  const items = deriveVaultSuggestions({
    teamWorkspace: {
      activeCandidateId: 'cand-2',
      candidates: [
        { id: 'cand-2', profile: { currentLocation: 'Pune' } }
      ]
    },
    careerEvidence: {
      'local-profile': {
        resume: { text: 'https://github.com/wrong-candidate https://linkedin.com/in/wrong-candidate' }
      }
    }
  });

  const byKey = Object.fromEntries(items.map((x) => [x.key, x]));
  assert.equal(byKey.currentLocation.value, 'Pune');
  assert.equal(byKey.githubUrl, undefined);
  assert.equal(byKey.linkedinUrl, undefined);
});
