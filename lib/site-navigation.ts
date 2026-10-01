/** Shared route mapping for the public menu and the administration workspace. */
export const publicNavigation = [
  {id: 'gioi-thieu', label: 'Giới thiệu', href: '/gioi-thieu', adminSection: 'gioi-thieu'},
  {id: 'du-an', label: 'Dự án', href: '/du-an', adminSection: 'quan-ly-du-an'},
  {id: 'quy-hang', label: 'Quỹ căn', href: '/quy-hang', adminSection: 'quan-ly'},
  {id: 'tin-tuc', label: 'Tin tức', href: '/tin-tuc', adminSection: 'bai-viet'},
  {id: 'huong-dan', label: 'Hướng dẫn', href: '/huong-dan', adminSection: 'huong-dan'},
] as const;

export const adminSections = new Set(['tong-quan', ...publicNavigation.map(tab => tab.adminSection), 'khach-hang', 'giao-dich', 'thu-vien', 'thanh-vien', 'cau-hinh']);
export const editorSections = new Set<string>([...publicNavigation.map(tab => tab.adminSection), 'thu-vien']);

export function publicTabForAdmin(section: string) {
  return publicNavigation.find(tab => tab.adminSection === section);
}
