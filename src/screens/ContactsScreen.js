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
import { COLORS, SIZES, RADIUS, FONT_FAMILY } from '../utils/theme';

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
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        emergencyContacts: arrayUnion({ ...newContact, id: Date.now().toString() })
      });
      
      await refreshProfile();
      setNewContact({ name: '', phone: '', relation: '' });
      setShowModal(false);
      Alert.alert('Success', 'Emergency contact added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add contact');
    }
  };

  const deleteContact = async (contactId) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userRef = doc(db, 'users', user.uid);
              await updateDoc(userRef, {
                emergencyContacts: arrayRemove(contactId)
              });
              await refreshProfile();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          }
        }
      ]
    );
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { fontFamily: FONT_FAMILY.regular }]}>{item.name}</Text>
        <Text style={[styles.contactPhone, { fontFamily: FONT_FAMILY.regular }]}>{item.phone}</Text>
        <Text style={[styles.contactRelation, { fontFamily: FONT_FAMILY.regular }]}>{item.relation}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteContact(item)}
      >
        <Text style={[styles.deleteText, { fontFamily: FONT_FAMILY.regular }]}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPhoneContact = ({ item }) => (
    <TouchableOpacity
      style={styles.phoneContactItem}
      onPress={() => addFromPhone(item)}
    >
      <Text style={[styles.phoneContactName, { fontFamily: FONT_FAMILY.regular }]}>{item.name}</Text>
      <Text style={[styles.phoneContactPhone, { fontFamily: FONT_FAMILY.regular }]}>
        {item.phoneNumbers?.[0]?.number}
      </Text>
    </TouchableOpacity>
  );

  const filteredPhoneContacts = phoneContacts.filter(contact =>
    contact.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Text style={[styles.title, { fontFamily: FONT_FAMILY.bold }]}>Emergency Contacts</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openModal}>
          <Text style={[styles.addBtnText, { fontFamily: FONT_FAMILY.regular }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { fontFamily: FONT_FAMILY.regular }]}>👥</Text>
            <Text style={[styles.emptyText, { fontFamily: FONT_FAMILY.regular }]}>No emergency contacts yet</Text>
            <Text style={[styles.emptySubtext, { fontFamily: FONT_FAMILY.regular }]}>Add trusted contacts for quick SOS alerts</Text>
          </View>
        }
      />

      {/* Add Contact Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={[styles.cancelBtn, { fontFamily: FONT_FAMILY.regular }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { fontFamily: FONT_FAMILY.bold }]}>Add Emergency Contact</Text>
            <TouchableOpacity onPress={saveContact}>
              <Text style={[styles.saveBtn, { fontFamily: FONT_FAMILY.regular }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={[styles.label, { fontFamily: FONT_FAMILY.regular }]}>Name</Text>
              <TextInput
                style={styles.input}
                value={newContact.name}
                onChangeText={(text) => setNewContact({ ...newContact, name: text })}
                placeholder="Enter name"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { fontFamily: FONT_FAMILY.regular }]}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={newContact.phone}
                onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { fontFamily: FONT_FAMILY.regular }]}>Relation</Text>
              <TextInput
                style={styles.input}
                value={newContact.relation}
                onChangeText={(text) => setNewContact({ ...newContact, relation: text })}
                placeholder="Family, Friend, etc."
              />
            </View>

            <View style={styles.divider}>
              <Text style={[styles.dividerText, { fontFamily: FONT_FAMILY.regular }]}>OR IMPORT FROM PHONE</Text>
            </View>

            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search contacts..."
            />

            {loading ? (
              <ActivityIndicator style={styles.loader} />
            ) : (
              <FlatList
                data={filteredPhoneContacts}
                renderItem={renderPhoneContact}
                keyExtractor={(item, index) => index.toString()}
                style={styles.phoneList}
                ListEmptyComponent={
                  <Text style={styles.noContacts}>No contacts found</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 24,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  contactPhone: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  contactRelation: {
    fontSize: SIZES.xs,
    color: COLORS.primary,
    marginTop: 4,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteText: {
    fontSize: 18,
    color: COLORS.danger,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cancelBtn: {
    color: COLORS.textSecondary,
    fontSize: SIZES.md,
  },
  modalTitle: {
    fontSize: SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveBtn: {
    color: COLORS.primary,
    fontSize: SIZES.md,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    fontSize: SIZES.md,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  divider: {
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerText: {
    fontSize: SIZES.xs,
    color: COLORS.textMuted,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    fontSize: SIZES.md,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  phoneList: {
    flex: 1,
  },
  phoneContactItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  phoneContactName: {
    fontSize: SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  phoneContactPhone: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  noContacts: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 20,
  },
});
