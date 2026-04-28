// src/screens/ContactsScreen.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, TextInput, Alert, ActivityIndicator,
  Modal, StatusBar,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES, RADIUS } from '../utils/theme';

export default function ContactsScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const [contacts, setContacts] = useState(profile?.emergencyContacts || []);
  const [showModal, setShowModal] = useState(false);
  const [phoneContacts, setPhoneContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '' });

  useEffect(() => {
    setContacts(profile?.emergencyContacts || []);
  }, [profile]);

  // Load phone contacts
  const loadPhoneContacts = async () => {
    setLoading(true);
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers] });
      setPhoneContacts(data.filter((c) => c.phoneNumbers?.length));
    }
    setLoading(false);
  };

  const openModal = () => {
    setShowModal(true);
    loadPhoneContacts();
  };

  const addFromPhone = (contact) => {
    const phone = contact.phoneNumbers?.[0]?.number?.replace(/\s+/g, '') || '';
    setNewContact({ name: contact.name || '', phone, relation: 'Family' });
  };

  const saveContact = async () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Missing Info', 'Please enter name and phone number.');
      return;
    }
    if (contacts.length >= 10) {
      Alert.alert('Limit Reached', 'You can save up to 10 emergency contacts.');
      return;
    }

    const entry = { ...newContact, id: Date.now().toString(), addedAt: new Date().toISOString() };

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        emergencyContacts: arrayUnion(entry),
      });
      setContacts((prev) => [...prev, entry]);
      setNewContact({ name: '', phone: '', relation: '' });
      setShowModal(false);
      refreshProfile();
      Alert.alert('Contact Added', `${entry.name} added to your trusted circle.`);
    } catch (err) {
      Alert.alert('Error', 'Could not save contact.');
    }
  };

  const removeContact = (contact) => {
    Alert.alert(
      'Remove Contact',
      `Remove ${contact.name} from your emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await updateDoc(doc(db, 'users', user.uid), {
              emergencyContacts: arrayRemove(contact),
            });
            setContacts((prev) => prev.filter((c) => c.id !== contact.id));
            refreshProfile();
          },
        },
      ]
    );
  };

  const RELATIONS = ['Family', 'Friend', 'Partner', 'Colleague', 'Neighbour', 'Other'];
  const filtered = phoneContacts.filter(
    (c) => c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderContact = ({ item }) => (
    <View style={styles.contactCard}>
      <View style={[styles.avatar, { backgroundColor: COLORS.primaryLight }]}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
        <View style={styles.relationPill}>
          <Text style={styles.relationText}>{item.relation}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeContact(item)}>
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <Text style={styles.subtitle}>Alerts go to all these people during SOS</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{contacts.length}/10 saved</Text>
        </View>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoText}>
          🆘 During SOS, all contacts below will receive your live location, audio/video evidence, and an SMS alert automatically.
        </Text>
      </View>

      {/* List */}
      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No contacts yet</Text>
          <Text style={styles.emptyText}>Add trusted people who will be alerted in an emergency.</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          contentContainerStyle={{ padding: 16, gap: 10 }}
        />
      )}

      {/* Add button */}
      <TouchableOpacity style={styles.addBtn} onPress={openModal}>
        <Text style={styles.addBtnText}>+ Add Emergency Contact</Text>
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Contact</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Manual entry */}
            <View style={styles.manualSection}>
              <Text style={styles.sectionLabel}>Enter manually</Text>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                value={newContact.name}
                onChangeText={(v) => setNewContact((p) => ({ ...p, name: v }))}
                placeholderTextColor={COLORS.textMuted}
              />
              <TextInput
                style={styles.input}
                placeholder="Mobile number (e.g. 9876543210)"
                value={newContact.phone}
                onChangeText={(v) => setNewContact((p) => ({ ...p, phone: v }))}
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.textMuted}
              />
              <View style={styles.relationsRow}>
                {RELATIONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.relChip, newContact.relation === r && styles.relChipActive]}
                    onPress={() => setNewContact((p) => ({ ...p, relation: r }))}
                  >
                    <Text style={[styles.relChipText, newContact.relation === r && styles.relChipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={saveContact}>
                <Text style={styles.saveBtnText}>Save Contact</Text>
              </TouchableOpacity>
            </View>

            {/* Phone contacts */}
            <Text style={styles.sectionLabel}>Or choose from your phone</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={COLORS.textMuted}
            />
            {loading
              ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
              : (
                <FlatList
                  data={filtered.slice(0, 30)}
                  keyExtractor={(item) => item.id}
                  style={{ maxHeight: 200 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.phoneContactRow} onPress={() => addFromPhone(item)}>
                      <View style={styles.phoneAvatar}>
                        <Text style={styles.phoneAvatarText}>{item.name?.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.phoneContactName}>{item.name}</Text>
                        <Text style={styles.phoneContactNum}>{item.phoneNumbers?.[0]?.number}</Text>
                      </View>
                      <Text style={styles.selectText}>Select</Text>
                    </TouchableOpacity>
                  )}
                />
              )
            }
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingTop: 52, backgroundColor: COLORS.primary },
  title: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.white },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  countBadge: {
    alignSelf: 'flex-start', marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4,
  },
  countText: { fontSize: 12, color: COLORS.white, fontWeight: '600' },
  infoBanner: {
    backgroundColor: COLORS.primaryLight, margin: 16,
    borderRadius: RADIUS.md, padding: 12,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  infoText: { fontSize: 12, color: COLORS.primaryDark, lineHeight: 18 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  contactCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 14, borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  contactPhone: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  relationPill: {
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  relationText: { fontSize: 10, color: COLORS.primaryDark, fontWeight: '600' },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  addBtn: {
    margin: 16, backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg, padding: 16, alignItems: 'center',
  },
  addBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalClose: { fontSize: 20, color: COLORS.textSecondary },
  manualSection: { gap: 8, marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  input: {
    height: 46, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: 14,
    fontSize: 14, color: COLORS.text, backgroundColor: COLORS.surface,
  },
  relationsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  relChip: {
    borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  relChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  relChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  relChipTextActive: { color: COLORS.white },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    padding: 12, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  searchInput: {
    height: 40, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: 12,
    fontSize: 13, color: COLORS.text, marginBottom: 8,
  },
  phoneContactRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight, gap: 10,
  },
  phoneAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.infoLight, alignItems: 'center', justifyContent: 'center',
  },
  phoneAvatarText: { fontSize: 14, fontWeight: '700', color: COLORS.police },
  phoneContactName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  phoneContactNum: { fontSize: 11, color: COLORS.textSecondary },
  selectText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
});
