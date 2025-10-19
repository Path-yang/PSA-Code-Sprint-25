import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Mail, User, Briefcase, AlertTriangle } from 'lucide-react';
import { getEscalationContact } from '../data/escalationContacts';

export default function EscalationDetails({ module, escalateTo, escalateReason }) {
  const contactInfo = getEscalationContact(module);
  
  if (!contactInfo) return null;
  
  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <CardTitle className="text-base text-orange-900 dark:text-orange-100">
            Escalation Details
          </CardTitle>
        </div>
        {escalateReason && (
          <CardDescription className="text-orange-700 dark:text-orange-300">
            {escalateReason}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Person */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-2">
            <User className="w-4 h-4" />
            Contact Person
          </h4>
          <div className="ml-6 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-orange-900 dark:text-orange-100">
                {contactInfo.contact.name}
              </span>
              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                {contactInfo.contact.title}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
              <Mail className="w-3.5 h-3.5" />
              <a 
                href={`mailto:${contactInfo.contact.email}`}
                className="hover:underline"
              >
                {contactInfo.contact.email}
              </a>
            </div>
            <div className="flex items-start gap-2 text-sm text-orange-700 dark:text-orange-300">
              <Briefcase className="w-3.5 h-3.5 mt-0.5" />
              <span>{contactInfo.role}</span>
            </div>
          </div>
        </div>
        
        {/* Escalation Steps */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
            Escalation Procedure
          </h4>
          <ul className="ml-4 space-y-1.5 text-sm text-orange-700 dark:text-orange-300">
            {contactInfo.escalationSteps.map((step, index) => (
              <li key={index} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ul>
        </div>
        
        {escalateTo && escalateTo !== "null" && (
          <div className="pt-2 border-t border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-600 dark:text-orange-400">
              <strong>Escalate to:</strong> {escalateTo}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

