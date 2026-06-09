-- 56 Selected Items of Cost from 2 CFR 200 Subpart E (§200.420–§200.476)
-- Each with CFR section, title, allowability, SF-424A mapping, conditions, keywords, framework applicability

INSERT INTO omb_cost_principles (cfr_section, title, allowability, sf424a_category, conditions, keywords, framework) VALUES

-- §200.420 Considerations for selected items of cost
('200.420', 'Considerations for selected items of cost', 'conditional', 'other',
 'General principles for determining allowability of costs under federal awards.',
 ARRAY['cost principles', 'allowability', 'selected items'], 'both'),

-- §200.421 Advertising and public relations
('200.421', 'Advertising and public relations', 'conditional', 'other',
 'Allowable for recruitment of personnel, procurement of goods/services, disposal of surplus materials, and other specific purposes outlined in the award.',
 ARRAY['advertising', 'public relations', 'recruitment', 'marketing', 'media'], 'both'),

-- §200.422 Advisory councils
('200.422', 'Advisory councils', 'allowable', 'other',
 'Costs of advisory councils or committees are allowable when authorized by the Federal awarding agency or approved in the budget.',
 ARRAY['advisory', 'council', 'committee', 'board'], 'both'),

-- §200.423 Alcoholic beverages
('200.423', 'Alcoholic beverages', 'unallowable', 'other',
 'Costs of alcoholic beverages are unallowable.',
 ARRAY['alcohol', 'beverages', 'liquor', 'wine', 'beer'], 'both'),

-- §200.424 Alumni/ae activities
('200.424', 'Alumni/ae activities', 'unallowable', 'other',
 'Costs incurred for alumni/ae activities are unallowable.',
 ARRAY['alumni', 'alumnae', 'reunion', 'homecoming'], 'both'),

-- §200.425 Audit services
('200.425', 'Audit services', 'allowable', 'contractual',
 'Costs for audits required by the Single Audit Act are allowable. Costs for other audits are allowable if included in approved budget.',
 ARRAY['audit', 'single audit', 'auditor', 'accounting', 'compliance audit'], 'both'),

-- §200.426 Bad debts
('200.426', 'Bad debts', 'unallowable', 'other',
 'Bad debts including losses from uncollectible accounts are unallowable.',
 ARRAY['bad debt', 'uncollectible', 'write-off', 'default'], 'both'),

-- §200.427 Bonding costs
('200.427', 'Bonding costs', 'allowable', 'other',
 'Costs of bonding employees and officials are allowable when required by the terms of the award.',
 ARRAY['bonding', 'fidelity bond', 'surety', 'insurance bond'], 'both'),

-- §200.428 Collections of improper payments
('200.428', 'Collections of improper payments', 'allowable', 'other',
 'Costs incurred to recover improper payments are allowable.',
 ARRAY['improper payments', 'recovery', 'collections', 'overpayment'], 'both'),

-- §200.429 Commencement and convocation costs
('200.429', 'Commencement and convocation costs', 'unallowable', 'other',
 'Costs for commencement and convocation activities are unallowable.',
 ARRAY['commencement', 'convocation', 'graduation', 'ceremony'], 'both'),

-- §200.430 Compensation—personal services
('200.430', 'Compensation—personal services', 'allowable', 'personnel',
 'Compensation for personal services including salaries, wages, and fringe benefits is allowable if reasonable, conforms to established policies, and is consistently applied.',
 ARRAY['salary', 'wages', 'compensation', 'payroll', 'personal services', 'staff', 'employee'], 'both'),

-- §200.431 Compensation—fringe benefits
('200.431', 'Compensation—fringe benefits', 'allowable', 'fringe_benefits',
 'Fringe benefits are allowable provided they are reasonable and required by law, employer-employee agreement, or established policy.',
 ARRAY['fringe', 'benefits', 'health insurance', 'retirement', 'pension', 'FICA', 'workers comp', '401k'], 'both'),

-- §200.432 Conferences
('200.432', 'Conferences', 'conditional', 'other',
 'Conference costs are allowable if the primary purpose is dissemination of technical information and the costs are reasonable.',
 ARRAY['conference', 'seminar', 'workshop', 'symposium', 'meeting', 'convention'], 'both'),

-- §200.433 Contingency provisions
('200.433', 'Contingency provisions', 'unallowable', 'other',
 'Contributions to a contingency reserve or similar provisions are unallowable, except as noted.',
 ARRAY['contingency', 'reserve', 'provision', 'emergency fund'], 'both'),

-- §200.434 Contributions and donations
('200.434', 'Contributions and donations', 'unallowable', 'other',
 'Costs of contributions and donations to others are unallowable.',
 ARRAY['donation', 'contribution', 'gift', 'charitable'], 'both'),

-- §200.435 Defense and prosecution of criminal and civil proceedings
('200.435', 'Defense and prosecution of criminal and civil proceedings', 'conditional', 'other',
 'Legal costs for defense may be allowable under specific conditions outlined in the regulation.',
 ARRAY['legal', 'defense', 'prosecution', 'litigation', 'lawsuit', 'attorney'], 'both'),

-- §200.436 Depreciation
('200.436', 'Depreciation', 'allowable', 'equipment',
 'Depreciation on buildings, capital improvements, and equipment is allowable if based on acquisition cost and computed using acceptable methods.',
 ARRAY['depreciation', 'amortization', 'capital asset', 'useful life', 'book value'], 'both'),

-- §200.437 Employee health and welfare costs
('200.437', 'Employee health and welfare costs', 'allowable', 'fringe_benefits',
 'Costs incurred for employee health and welfare are allowable if operated as a formal plan or custom.',
 ARRAY['health', 'welfare', 'wellness', 'employee assistance', 'EAP', 'clinic'], 'both'),

-- §200.438 Entertainment costs
('200.438', 'Entertainment costs', 'unallowable', 'other',
 'Costs of entertainment including amusement, diversion, and social activities are unallowable.',
 ARRAY['entertainment', 'amusement', 'recreation', 'social', 'party', 'tickets'], 'both'),

-- §200.439 Equipment and other capital expenditures
('200.439', 'Equipment and other capital expenditures', 'conditional', 'equipment',
 'Capital expenditures for equipment are allowable with prior approval when the acquisition cost meets the threshold. Pre-Oct 2024: $5,000. Post-Oct 2024: $10,000.',
 ARRAY['equipment', 'capital', 'machinery', 'furniture', 'computer', 'vehicle', 'capital expenditure'], 'both'),

-- §200.440 Exchange rates
('200.440', 'Exchange rates', 'allowable', 'other',
 'Cost increases for fluctuations in exchange rates are allowable if the non-Federal entity has no effective means of controlling such costs.',
 ARRAY['exchange rate', 'currency', 'foreign exchange', 'forex'], 'both'),

-- §200.441 Fines, penalties, damages and other settlements
('200.441', 'Fines, penalties, damages and other settlements', 'unallowable', 'other',
 'Costs resulting from violations of or failure to comply with laws and regulations are unallowable.',
 ARRAY['fines', 'penalties', 'damages', 'settlements', 'violations'], 'both'),

-- §200.442 Fund raising and investment management costs
('200.442', 'Fund raising and investment management costs', 'unallowable', 'other',
 'Costs of organized fund raising and investment activities are unallowable.',
 ARRAY['fundraising', 'fund raising', 'investment', 'endowment', 'development office'], 'both'),

-- §200.443 Gains and losses on disposition of depreciable assets
('200.443', 'Gains and losses on disposition of depreciable assets', 'conditional', 'other',
 'Gains and losses on sale, retirement, or other disposition of depreciable property must be handled as adjustments to the asset cost.',
 ARRAY['gains', 'losses', 'disposition', 'sale', 'retirement', 'asset disposal'], 'both'),

-- §200.444 General costs of government
('200.444', 'General costs of government', 'unallowable', 'other',
 'For state, local, and Indian tribal governments, the general costs of government are unallowable except as specifically allowed.',
 ARRAY['government costs', 'executive', 'legislative', 'judicial'], 'both'),

-- §200.445 Goods or services for personal use
('200.445', 'Goods or services for personal use', 'unallowable', 'other',
 'Costs of goods or services for personal use of employees are unallowable.',
 ARRAY['personal use', 'personal benefit', 'employee perks'], 'both'),

-- §200.446 Idle facilities and idle capacity
('200.446', 'Idle facilities and idle capacity', 'conditional', 'other',
 'Costs of idle facilities are generally unallowable except under certain conditions.',
 ARRAY['idle facilities', 'idle capacity', 'unused space', 'vacant'], 'both'),

-- §200.447 Insurance and indemnification
('200.447', 'Insurance and indemnification', 'allowable', 'other',
 'Costs of required or approved insurance are allowable.',
 ARRAY['insurance', 'indemnification', 'liability', 'property insurance', 'coverage', 'premium'], 'both'),

-- §200.448 Intellectual property
('200.448', 'Intellectual property', 'conditional', 'other',
 'Costs for patents, copyrights, and other intellectual property are allowable if required by the award or approved.',
 ARRAY['intellectual property', 'patent', 'copyright', 'trademark', 'royalty', 'license'], 'both'),

-- §200.449 Interest
('200.449', 'Interest', 'conditional', 'other',
 'Financing costs for certain capital assets are allowable if approved in advance by the Federal awarding agency.',
 ARRAY['interest', 'financing', 'loan', 'debt service', 'borrowing'], 'both'),

-- §200.450 Lobbying
('200.450', 'Lobbying', 'unallowable', 'other',
 'Costs associated with lobbying activities are unallowable.',
 ARRAY['lobbying', 'political', 'legislative', 'advocacy', 'influencing'], 'both'),

-- §200.451 Losses on other awards or contracts
('200.451', 'Losses on other awards or contracts', 'unallowable', 'other',
 'Excess of costs over income under any other award or contract is unallowable.',
 ARRAY['losses', 'deficit', 'cost overrun', 'other awards'], 'both'),

-- §200.452 Maintenance and repair costs
('200.452', 'Maintenance and repair costs', 'allowable', 'other',
 'Costs for maintenance and repair of buildings and equipment are allowable.',
 ARRAY['maintenance', 'repair', 'upkeep', 'renovation', 'facility maintenance'], 'both'),

-- §200.453 Materials and supplies costs, including computing devices
('200.453', 'Materials and supplies costs, including computing devices', 'allowable', 'supplies',
 'Costs for materials and supplies necessary for the award are allowable. Computing devices under the equipment threshold are supplies.',
 ARRAY['materials', 'supplies', 'computing devices', 'office supplies', 'consumables', 'lab supplies'], 'both'),

-- §200.454 Memberships, subscriptions, and professional activity costs
('200.454', 'Memberships, subscriptions, and professional activity costs', 'conditional', 'other',
 'Costs for business, professional, and technical memberships are allowable. Civic/community memberships are allowable with approval.',
 ARRAY['membership', 'subscription', 'professional', 'association', 'dues'], 'both'),

-- §200.455 Organization costs
('200.455', 'Organization costs', 'conditional', 'other',
 'Costs for incorporation and organization of a new entity are allowable with approval.',
 ARRAY['organization', 'incorporation', 'startup', 'formation'], 'both'),

-- §200.456 Participant support costs
('200.456', 'Participant support costs', 'allowable', 'other',
 'Participant support costs including stipends, travel, and registration fees for participants are allowable with prior approval.',
 ARRAY['participant support', 'stipend', 'trainee', 'participant travel', 'registration'], 'both'),

-- §200.457 Plant and security costs
('200.457', 'Plant and security costs', 'allowable', 'other',
 'Necessary and reasonable costs for protection and security of facilities and personnel are allowable.',
 ARRAY['security', 'plant security', 'guard', 'surveillance', 'access control'], 'both'),

-- §200.458 Pre-award costs
('200.458', 'Pre-award costs', 'conditional', 'other',
 'Pre-award costs are allowable if they would have been allowable if incurred after the award date and with prior approval.',
 ARRAY['pre-award', 'advance costs', 'preliminary', 'startup costs'], 'both'),

-- §200.459 Professional service costs
('200.459', 'Professional service costs', 'allowable', 'contractual',
 'Costs of professional and consultant services are allowable when reasonable and the individual is not an employee.',
 ARRAY['professional services', 'consultant', 'contractor', 'legal services', 'accounting services', 'engineering'], 'both'),

-- §200.460 Proposal costs
('200.460', 'Proposal costs', 'allowable', 'other',
 'Costs of preparing proposals for potential awards are allowable as indirect costs.',
 ARRAY['proposal', 'grant writing', 'application', 'bid preparation'], 'both'),

-- §200.461 Publication and printing costs
('200.461', 'Publication and printing costs', 'allowable', 'other',
 'Costs for publication and printing including electronic publishing are allowable.',
 ARRAY['publication', 'printing', 'publishing', 'report', 'journal', 'dissemination'], 'both'),

-- §200.462 Rearrangement and reconversion costs
('200.462', 'Rearrangement and reconversion costs', 'allowable', 'other',
 'Costs for ordinary and normal rearrangement and alteration of facilities are allowable.',
 ARRAY['rearrangement', 'reconversion', 'relocation', 'reconfiguration'], 'both'),

-- §200.463 Recruiting costs
('200.463', 'Recruiting costs', 'allowable', 'other',
 'Costs of recruiting are allowable to the extent they are reasonable.',
 ARRAY['recruiting', 'hiring', 'recruitment', 'job posting', 'relocation'], 'both'),

-- §200.464 Relocation costs of employees
('200.464', 'Relocation costs of employees', 'conditional', 'other',
 'Relocation costs are allowable if the move is for the benefit of the employer and reimbursement is in accordance with established policy.',
 ARRAY['relocation', 'moving', 'transfer', 'employee relocation'], 'both'),

-- §200.465 Rental costs of real property and equipment
('200.465', 'Rental costs of real property and equipment', 'allowable', 'other',
 'Rental costs are allowable to the extent they are reasonable and do not exceed fair market value.',
 ARRAY['rental', 'lease', 'rent', 'space', 'occupancy', 'equipment lease'], 'both'),

-- §200.466 Scholarships and student aid costs
('200.466', 'Scholarships and student aid costs', 'conditional', 'other',
 'Costs of scholarships and student aid are allowable when authorized by the Federal awarding agency.',
 ARRAY['scholarship', 'student aid', 'fellowship', 'tuition', 'stipend'], 'both'),

-- §200.467 Selling and marketing costs
('200.467', 'Selling and marketing costs', 'unallowable', 'other',
 'Costs of selling and marketing goods or services are generally unallowable unless specifically authorized.',
 ARRAY['selling', 'marketing', 'sales', 'promotion', 'advertising'], 'both'),

-- §200.468 Specialized service facilities
('200.468', 'Specialized service facilities', 'allowable', 'other',
 'Costs of specialized service facilities operated by the organization are allowable.',
 ARRAY['specialized facility', 'service center', 'core facility', 'lab services'], 'both'),

-- §200.469 Student activity costs
('200.469', 'Student activity costs', 'unallowable', 'other',
 'Costs for student activities (intramural, student publications, clubs) are unallowable unless specifically provided for in the award.',
 ARRAY['student activity', 'intramural', 'student club', 'student publication'], 'both'),

-- §200.470 Taxes (including Value Added Tax)
('200.470', 'Taxes (including Value Added Tax)', 'allowable', 'other',
 'Taxes that the non-Federal entity is legally required to pay are allowable, except for self-assessed taxes.',
 ARRAY['taxes', 'tax', 'VAT', 'sales tax', 'property tax', 'excise tax'], 'both'),

-- §200.471 Termination costs
('200.471', 'Termination costs', 'conditional', 'other',
 'Costs that would not have arisen had the award not been terminated are generally allowable.',
 ARRAY['termination', 'closeout', 'wind down', 'cancellation'], 'both'),

-- §200.472 Training and education costs
('200.472', 'Training and education costs', 'allowable', 'other',
 'Costs of training and education provided for employee development are allowable.',
 ARRAY['training', 'education', 'professional development', 'workshop', 'certification', 'continuing education'], 'both'),

-- §200.473 Transportation costs
('200.473', 'Transportation costs', 'allowable', 'travel',
 'Costs for freight, express, cartage, postage, and other transportation services are allowable.',
 ARRAY['transportation', 'freight', 'shipping', 'postage', 'courier', 'delivery'], 'both'),

-- §200.474 Travel costs
('200.474', 'Travel costs', 'allowable', 'travel',
 'Travel costs are allowable if directly attributable to the award and in conformance with written travel reimbursement policies.',
 ARRAY['travel', 'airfare', 'lodging', 'per diem', 'mileage', 'hotel', 'flight', 'transportation'], 'both'),

-- §200.475 Trustees
('200.475', 'Trustees', 'conditional', 'other',
 'Travel and subsistence costs of trustees/directors are allowable.',
 ARRAY['trustee', 'director', 'board member', 'governance'], 'both'),

-- §200.476 Indirect (F&A) costs
('200.476', 'Indirect (F&A) costs', 'allowable', 'indirect_charges',
 'Facilities and administrative costs are allowable. De minimis rate: 10% MTDC (pre-Oct 2024) or 15% MTDC (post-Oct 2024).',
 ARRAY['indirect', 'F&A', 'overhead', 'facilities', 'administrative', 'IDC', 'MTDC', 'de minimis'], 'both');
